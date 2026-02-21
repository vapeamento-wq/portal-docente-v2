import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { URL_TU_EXCEL_MAESTRO, URL_FIREBASE_CONSOLE } from '../utils/helpers';

const FIREBASE_DB_URL = `${import.meta.env.VITE_FIREBASE_DB_BASE_URL}/docentes.json`;

// MOCK_ANALYTICS has been removed in favor of real Firebase data

const AdminPanel = ({ onBack, onSelectDocente }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [docentesList, setDocentesList] = useState([]);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [filterDocente, setFilterDocente] = useState('');
    const [loadingDocentes, setLoadingDocentes] = useState(true);
    const [docentesListFull, setDocentesListFull] = useState([]); // Raw data for radar
    const [anuncioGlobal, setAnuncioGlobal] = useState('');
    const [guardandoAnuncio, setGuardandoAnuncio] = useState(false);

    useEffect(() => {
        // Fetch current teachers on mount
        const fetchData = async () => {
            try {
                // Fetch Teachers
                const resDocentes = await fetch(FIREBASE_DB_URL);
                const dataDocentes = await resDocentes.json();
                if (dataDocentes) {
                    const list = Object.values(dataDocentes).map(d => ({
                        id: d.idReal,
                        nombre: d.nombre,
                        cursosCount: d.cursos ? d.cursos.length : 0
                    }));
                    setDocentesList(list);
                    setDocentesListFull(Object.values(dataDocentes));
                } else {
                    setDocentesList([]);
                    setDocentesListFull([]);
                }

                // Fetch Analytics
                const dbBaseUrl = import.meta.env.VITE_FIREBASE_DB_BASE_URL;
                const resStats = await fetch(`${dbBaseUrl}/analytics/daily.json`);
                const dataStats = await resStats.json();
                if (dataStats) {
                    // Convert object {"YYYY-MM-DD": count} to array [{name: "DD/MM", consultas: count}]
                    const formattedStats = Object.keys(dataStats).slice(-10).map(dateStr => {
                        const [yyyy, mm, dd] = dateStr.split('-');
                        return { name: `${dd}/${mm}`, consultas: dataStats[dateStr] };
                    });
                    setAnalyticsData(formattedStats);
                }

                // Fetch Global Announcement
                const resAnuncio = await fetch(`${dbBaseUrl}/config/anuncio.json`);
                const dataAnuncio = await resAnuncio.json();
                if (dataAnuncio && dataAnuncio.texto) {
                    setAnuncioGlobal(dataAnuncio.texto);
                }
            } catch (err) {
                console.error("Error fetching admin data:", err);
            } finally {
                setLoadingDocentes(false);
            }
        };
        fetchData();
    }, []);

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

    // Calculate Radar (Active Today)
    const [radarHoy, setRadarHoy] = useState([]);
    useEffect(() => {
        if (!docentesListFull.length) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activos = [];

        docentesListFull.forEach(docente => {
            if (!docente.cursos) return;

            docente.cursos.forEach(curso => {
                if (!curso.semanas) return;

                curso.semanas.forEach(semana => {
                    if (semana.fechaObj) {
                        const eventDate = new Date(semana.fechaObj);
                        eventDate.setHours(0, 0, 0, 0);
                        if (eventDate.getTime() === today.getTime()) {
                            activos.push({
                                idDocente: docente.idReal,
                                nombreDocente: docente.nombre,
                                cursoMateria: curso.materia,
                                tipo: semana.tipo,
                                hora: semana.hora,
                                numSemana: semana.num
                            });
                        }
                    }
                });
            });
        });

        setRadarHoy(activos);
    }, [docentesListFull]);

    const handleGuardarAnuncio = async (e) => {
        e.preventDefault();
        setGuardandoAnuncio(true);
        try {
            const secretAuth = import.meta.env.VITE_FIREBASE_SECRET;
            const dbBaseUrl = import.meta.env.VITE_FIREBASE_DB_BASE_URL;
            await fetch(`${dbBaseUrl}/config/anuncio.json?auth=${secretAuth}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: anuncioGlobal, fecha: new Date().toISOString() })
            });
            alert('Anuncio Global actualizado y publicado con éxito.');
        } catch (err) {
            console.error(err);
            alert('Error al publicar el anuncio.');
        } finally {
            setGuardandoAnuncio(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] dark:bg-slate-900 p-5 flex flex-col items-center font-sans transition-colors duration-300">
            <div className="fade-in-up w-full max-w-5xl bg-white dark:bg-slate-800 p-10 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none transition-colors duration-300">

                <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-slate-700 pb-5">
                    <div>
                        <h2 className="text-[#003366] dark:text-blue-400 m-0 text-2xl font-bold">PANEL INTELIGENTE</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-0">Sincronización y Configuración</p>
                    </div>
                    <button onClick={onBack} className="cursor-pointer px-6 py-2.5 rounded-full border-none bg-gray-100 dark:bg-slate-700 font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">⬅ Volver</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">

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
                            {analyticsData.length > 0 ? (
                                <BarChart data={analyticsData}>
                                    <XAxis dataKey="name" fontSize={12} stroke="#888" />
                                    <YAxis fontSize={12} stroke="#888" allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="consultas" fill="#003366" radius={[4, 4, 0, 0]} className="dark:fill-blue-500" />
                                </BarChart>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                    No hay suficientes datos registrados todavía.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Existing Tools (Excel, Firebase) */}
                    <div className="flex flex-col gap-5">
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl flex flex-col gap-4 border border-transparent dark:border-slate-700 transition-colors justify-center">
                            <h4 className="m-0 font-bold dark:text-gray-200 text-lg">Accesos Rápidos</h4>
                            <a href={URL_TU_EXCEL_MAESTRO} target="_blank" rel="noreferrer" className="block p-4 bg-[#27ae60] text-white text-center rounded-xl no-underline font-bold hover:bg-[#219653] transition-colors shadow-sm">Excel Maestro</a>
                            <a href={URL_FIREBASE_CONSOLE} target="_blank" rel="noreferrer" className="block p-4 bg-[#f39c12] text-white text-center rounded-xl no-underline font-bold hover:bg-[#d68910] transition-colors shadow-sm">Firebase Console</a>
                        </div>
                    </div>
                </div>

                {/* NUEVO: Anuncio Global */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors mb-8">
                    <h4 className="m-0 mb-4 text-[#003366] dark:text-blue-400 font-bold text-xl">📢 Anuncio Global</h4>
                    <form onSubmit={handleGuardarAnuncio} className="flex flex-col gap-4">
                        <textarea
                            value={anuncioGlobal}
                            onChange={(e) => setAnuncioGlobal(e.target.value)}
                            placeholder="Escribe un mensaje aquí para que todos los docentes lo vean al entrar..."
                            className="w-full p-4 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 transition-all min-h-[100px] resize-y"
                        ></textarea>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">El mensaje saltará como una alerta destacada. Déjalo en blanco para desactivarlo.</span>
                            <button type="submit" disabled={guardandoAnuncio} className="px-6 py-2 bg-[#003366] dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-[#002244] dark:hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                {guardandoAnuncio ? 'Guardando...' : 'Publicar Anuncio'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RADAR AND TABLE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

                    {/* RADAR DE HOY */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors flex flex-col h-[600px]">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="m-0 text-orange-500 font-bold text-lg flex items-center gap-2">🔥 Radar (Hoy)</h4>
                            <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 font-bold px-2.5 py-1 rounded-full text-xs">{radarHoy.length} Activos</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">Docentes con programación para el día de hoy.</p>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {radarHoy.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm py-10">No hay actividad programada para hoy.</div>
                            ) : (
                                radarHoy.map((act, i) => (
                                    <div
                                        key={i}
                                        onClick={() => onSelectDocente(act.idDocente)}
                                        className="p-3 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-900/30 rounded-xl cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                    >
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1 leading-tight">{act.nombreDocente}</div>
                                        <div className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-2">Semana {act.numSemana} • {act.cursoMateria}</div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-bold flex items-center gap-1">⏰ {act.hora}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400">
                                                {act.tipo === 'INDEPENDIENTE' ? '🏠 INDEP' : '🏫 PRESENCIAL'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Directorio de Docentes Real */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors overflow-hidden flex flex-col h-[600px]">
                        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                            <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-xl">👥 Directorio Sincronizado ({docentesList.length})</h4>
                            <input
                                type="text"
                                placeholder="Buscar docente o cédula..."
                                value={filterDocente}
                                onChange={(e) => setFilterDocente(e.target.value)}
                                className="p-3 w-full md:w-64 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all font-medium text-sm"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                                    <tr className="border-b-2 border-gray-100 dark:border-slate-700">
                                        <th className="p-3 text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Nombre del Docente</th>
                                        <th className="p-3 text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Cédula</th>
                                        <th className="p-3 text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Cursos Asignados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingDocentes ? (
                                        <tr>
                                            <td colSpan="3" className="p-10 text-center text-gray-500">
                                                <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#003366] dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Cargando docentes de Firebase...
                                            </td>
                                        </tr>
                                    ) : docentesList.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="p-6 text-center text-gray-500 dark:text-gray-400">No hay docentes sincronizados actualmente. Sube el Excel.</td>
                                        </tr>
                                    ) : (
                                        docentesList
                                            .filter(d =>
                                                d.nombre.toLowerCase().includes(filterDocente.toLowerCase()) ||
                                                d.id.includes(filterDocente)
                                            )
                                            .slice(0, 15) // Limit to top 15 matches for quick UI
                                            .map(d => (
                                                <tr
                                                    key={d.id}
                                                    onClick={() => onSelectDocente(d.id)}
                                                    className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
                                                >
                                                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#003366] dark:group-hover:text-blue-400 transition-colors">{d.nombre}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-sm">{d.id}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-400"><span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-bold px-2 py-1 rounded text-xs">{d.cursosCount}</span></td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                            {docentesList.length > 15 && filterDocente === '' && (
                                <div className="text-center p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Mostrando primeros 15 docentes. Usa el buscador para encontrar más.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
