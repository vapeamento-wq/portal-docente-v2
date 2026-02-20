import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { URL_TU_EXCEL_MAESTRO, URL_FIREBASE_CONSOLE } from '../utils/helpers';

const FIREBASE_DB_URL = "https://portal-creo-db-default-rtdb.firebaseio.com/docentes.json";

const MOCK_ANALYTICS = {
    daily: [
        { name: 'Lun', consultas: 12 }, { name: 'Mar', consultas: 19 }, { name: 'Mie', consultas: 15 },
        { name: 'Jue', consultas: 25 }, { name: 'Vie', consultas: 22 }, { name: 'Sab', consultas: 30 },
        { name: 'Dom', consultas: 10 },
    ],
    hourly: [
        { name: '08:00', hits: 5 }, { name: '10:00', hits: 12 }, { name: '12:00', hits: 8 },
        { name: '14:00', hits: 15 }, { name: '16:00', hits: 20 }, { name: '18:00', hits: 18 },
    ]
};

const AdminPanel = ({ onBack, adminSearch, setAdminSearch, adminResult, onAdminDiagnostico }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadResult('⏳ Analizando archivo Excel...');

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });

                let docentesDB = {};
                let countCursos = 0;

                // Empezar a leer desde la fila 1 (saltando el header en fila 0)
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;

                    const nombreProfesor = row[6];
                    let documento = row[7];
                    const asignatura = row[9];

                    if (!documento || !nombreProfesor || !asignatura) continue;

                    // Limpiar cédula
                    documento = String(documento).replace(/\D/g, '');
                    if (!documento) continue;

                    // Extraer los datos del curso
                    const curso = {
                        materia: asignatura,
                        grupo: row[11] || '',
                        bloque: row[14] || '',
                        fInicio: row[48] || '', // FECHA INICIAL
                        fFin: row[49] || '',    // FECHA FINAL
                        semanasRaw: []
                    };

                    // Extraer las 16 semanas (Columnas 50 a 65 en el nuevo Excel)
                    for (let s = 50; s <= 65; s++) {
                        curso.semanasRaw.push(row[s] || '-');
                    }

                    // Insertar en la base de datos
                    if (!docentesDB[documento]) {
                        docentesDB[documento] = {
                            idReal: documento,
                            nombre: nombreProfesor,
                            cursos: []
                        };
                    }
                    docentesDB[documento].cursos.push(curso);
                    countCursos++;
                }

                const countDocentes = Object.keys(docentesDB).length;

                if (countDocentes === 0) {
                    setUploading(false);
                    setUploadResult('⚠️ El archivo no contiene datos válidos o el formato no coincide.');
                    return;
                }

                setUploadResult(`🚀 Subiendo ${countDocentes} docentes y ${countCursos} cursos a Firebase...`);

                // Sincronizar directo a Firebase con autenticación secreta
                const secretAuth = "eiRj3OTUFn7PSL1bxgB1c62hCQ6nGveQOUvxeo7m";
                const res = await fetch(`${FIREBASE_DB_URL}?auth=${secretAuth}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(docentesDB)
                });

                if (res.ok) {
                    setUploadResult(`✅ ¡Base de datos de Firebase actualizada con éxito!\nDocentes: ${countDocentes}\nCursos: ${countCursos}`);
                } else {
                    setUploadResult(`❌ Error de red al sincronizar con Firebase: ${res.statusText}`);
                }
            } catch (err) {
                console.error(err);
                setUploadResult(`❌ Error procesando el Excel: ${err.message}`);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div style={{ fontFamily: 'Segoe UI', background: '#f4f6f8', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="fade-in-up" style={{ maxWidth: '1000px', width: '100%', background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                    <div>
                        <h2 style={{ color: '#003366', margin: 0 }}>PANEL INTELIGENTE</h2>
                        <p style={{ color: '#666', margin: '5px 0 0' }}>Sincronización de Base de Datos</p>
                    </div>
                    <button onClick={onBack} style={{ cursor: 'pointer', padding: '10px 25px', borderRadius: '30px', border: 'none', background: '#f0f0f0', fontWeight: 'bold', color: '#333' }}>⬅ Volver</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                    {/* NUEVO: Subida de Excel Mágico */}
                    <div style={{ background: '#f5f9ff', padding: '25px', borderRadius: '20px', border: '2px dashed #007bff', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px', color: '#1e40af' }}>📥 Actualizar BD (Desde Excel)</h3>
                        <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '20px' }}>Sube el archivo Excel actualizado. El sistema lo analizará y sincronizará en tiempo real con Firebase.</p>

                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            style={{ display: 'block', margin: '0 auto', marginBottom: '15px' }}
                        />

                        {uploadResult && (
                            <pre style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.85rem', textAlign: 'left', whiteSpace: 'pre-wrap', color: '#333' }}>
                                {uploadResult}
                            </pre>
                        )}
                    </div>

                    {/* Chart 1: Daily Hits */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #eee', height: '300px' }}>
                        <h4 style={{ margin: '0 0 20px', color: '#003366' }}>📊 Consultas por Día</h4>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={MOCK_ANALYTICS.daily}>
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="consultas" fill="#003366" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Existing Tools & Diagnostico */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h4 style={{ margin: 0 }}>Accesos Rápidos</h4>
                            <a href="https://docs.google.com/spreadsheets/d/1fHgj_yep0s7955EeaRpFiJeBLJX_-PLtjOFxWepoprQ/edit" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '15px', background: '#27ae60', color: 'white', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Excel Maestro</a>
                            <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '15px', background: '#f39c12', color: 'white', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Firebase Console</a>
                        </div>

                        {/* Diagnostic Tool */}
                        <div style={{ padding: '20px', background: '#f0f2f5', borderRadius: '20px' }}>
                            <h4 style={{ margin: '0 0 10px' }}>🕵️ Diagnóstico</h4>
                            <form onSubmit={onAdminDiagnostico} style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    placeholder="Cédula..."
                                    value={adminSearch}
                                    onChange={e => setAdminSearch(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ccc' }}
                                />
                                <button style={{ padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Ver</button>
                            </form>
                            {adminResult && <div style={{ marginTop: '10px', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{adminResult}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
