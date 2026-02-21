import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { URL_TU_EXCEL_MAESTRO, URL_FIREBASE_CONSOLE } from '../utils/helpers';

const FIREBASE_DB_URL = `${import.meta.env.VITE_FIREBASE_DB_BASE_URL}/docentes.json`;

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
                const secretAuth = import.meta.env.VITE_FIREBASE_SECRET;
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
        <div className="min-h-screen bg-[#f4f6f8] dark:bg-slate-900 p-5 flex flex-col items-center font-sans transition-colors duration-300">
            <div className="fade-in-up w-full max-w-5xl bg-white dark:bg-slate-800 p-10 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none transition-colors duration-300">

                <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-slate-700 pb-5">
                    <div>
                        <h2 className="text-[#003366] dark:text-blue-400 m-0 text-2xl font-bold">PANEL INTELIGENTE</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-0">Sincronización de Base de Datos</p>
                    </div>
                    <button onClick={onBack} className="cursor-pointer px-6 py-2.5 rounded-full border-none bg-gray-100 dark:bg-slate-700 font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">⬅ Volver</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* NUEVO: Subida de Excel Mágico */}
                    <div className="bg-[#f5f9ff] dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-dashed border-[#007bff] text-center flex flex-col justify-center transition-colors">
                        <h3 className="m-0 mb-3 text-[#1e40af] dark:text-blue-300 text-xl font-bold">📥 Actualizar BD (Desde Excel)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Sube el archivo Excel actualizado. El sistema lo analizará y sincronizará en tiempo real con Firebase.</p>

                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block mx-auto mb-4 text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 transition-colors cursor-pointer disabled:cursor-not-allowed dark:file:bg-blue-900/50 dark:file:text-blue-300"
                        />

                        {uploading && (
                            <div className="flex justify-center items-center gap-2 mb-4 text-[#007bff] dark:text-blue-400 font-bold text-sm">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analizando y Sincronizando...
                            </div>
                        )}

                        {uploadResult && (
                            <pre className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-left whitespace-pre-wrap text-gray-800 dark:text-gray-300 mt-2 transition-colors">
                                {uploadResult}
                            </pre>
                        )}
                    </div>

                    {/* Chart 1: Daily Hits */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 h-[300px] transition-colors">
                        <h4 className="m-0 mb-5 text-[#003366] dark:text-blue-400 font-bold text-lg">📊 Consultas por Día</h4>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={MOCK_ANALYTICS.daily}>
                                <XAxis dataKey="name" fontSize={12} stroke="#888" />
                                <YAxis fontSize={12} stroke="#888" />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="consultas" fill="#003366" radius={[4, 4, 0, 0]} className="dark:fill-blue-500" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Existing Tools & Diagnostico */}
                    <div className="flex flex-col gap-5">
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl flex flex-col gap-4 border border-transparent dark:border-slate-700 transition-colors">
                            <h4 className="m-0 font-bold dark:text-gray-200 text-lg">Accesos Rápidos</h4>
                            <a href={URL_TU_EXCEL_MAESTRO} target="_blank" rel="noreferrer" className="block p-4 bg-[#27ae60] text-white text-center rounded-xl no-underline font-bold hover:bg-[#219653] transition-colors shadow-sm">Excel Maestro</a>
                            <a href={URL_FIREBASE_CONSOLE} target="_blank" rel="noreferrer" className="block p-4 bg-[#f39c12] text-white text-center rounded-xl no-underline font-bold hover:bg-[#d68910] transition-colors shadow-sm">Firebase Console</a>
                        </div>

                        {/* Diagnostic Tool */}
                        <div className="p-5 bg-gray-100 dark:bg-slate-800/80 rounded-2xl border border-transparent dark:border-slate-700 transition-colors">
                            <h4 className="m-0 mb-4 font-bold dark:text-gray-200 text-lg">🕵️ Diagnóstico</h4>
                            <form onSubmit={onAdminDiagnostico} className="flex gap-2">
                                <input
                                    placeholder="Cédula..."
                                    value={adminSearch}
                                    onChange={e => setAdminSearch(e.target.value)}
                                    className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 transition-all font-medium"
                                />
                                <button className="px-5 py-3 bg-gray-800 text-white border-none rounded-xl font-bold cursor-pointer hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-sm">Ver</button>
                            </form>
                            {adminResult && <div className="mt-4 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">{adminResult}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
