import React, { useState } from 'react';
import { obtenerColorLogs } from '../../../utils/helpers';

const AdminLogsTab = ({ logs = [], auditHistory = [] }) => {
    const [view, setView] = useState('searches'); // 'searches' or 'audit'

    const badgeCls = (accion) => {
        if (accion === 'CARGA_ESTUDIANTES') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        if (accion === 'CARGA_HORARIOS') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors fade-in-up">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-xl flex items-center gap-2">
                    {view === 'searches' ? '🔍 Registro de Búsquedas' : '🛡️ Historial de Auditoría'}
                </h4>

                <div className="flex bg-gray-100 dark:bg-slate-900/50 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                    <button 
                        onClick={() => setView('searches')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'searches' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Búsquedas Alumnos
                    </button>
                    <button 
                        onClick={() => setView('audit')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'audit' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Acciones Admin
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-gray-50 dark:bg-slate-900">
                        <tr className="border-b border-gray-200 dark:border-slate-700">
                            {view === 'searches' ? (
                                <>
                                    <th className="p-4 text-xs tracking-wider text-gray-500 dark:text-gray-400 uppercase font-bold">Fecha / Hora</th>
                                    <th className="p-4 text-xs tracking-wider text-gray-500 dark:text-gray-400 uppercase font-bold">Documento / Código</th>
                                    <th className="p-4 text-xs tracking-wider text-gray-500 dark:text-gray-400 uppercase font-bold">Estado / Resultado</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-4 text-xs tracking-wider text-gray-500 dark:text-gray-400 uppercase font-bold">Fecha / Hora</th>
                                    <th className="p-4 text-xs tracking-wider text-gray-500 dark:text-gray-400 uppercase font-bold">Administrador</th>
                                    <th className="p-4 text-xs tracking-wider text-gray-500 dark:text-gray-400 uppercase font-bold">Acción / Programa</th>
                                    <th className="p-4 text-xs tracking-wider text-gray-500 dark:text-gray-400 uppercase font-bold">Detalle</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {view === 'searches' ? (
                            logs.length === 0 ? (
                                <tr><td colSpan="3" className="p-8 text-center text-gray-500 dark:text-gray-400 italic">No hay registros de búsqueda disponibles.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{log.fecha || 'Sin fecha'}</td>
                                        <td className="p-4 text-sm font-mono text-[#003366] dark:text-blue-400 font-bold">{log.doc || 'N/A'}</td>
                                        <td className="p-4 text-sm">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${obtenerColorLogs(log.estado)}`}>
                                                {log.estado || 'Desconocido'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )
                        ) : (
                            auditHistory.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500 dark:text-gray-400 italic">No hay acciones administrativas registradas.</td></tr>
                            ) : (
                                auditHistory.map(audit => (
                                    <tr key={audit.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">{audit.fecha}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{audit.admin}</td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${badgeCls(audit.accion)}`}>
                                                    {audit.accion?.replace('_', ' ')}
                                                </span>
                                                <span className="text-gray-400 font-bold">→</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{audit.programa}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 font-bold">
                                            {audit.total} registros procesados
                                        </td>
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                <p className="text-[11px] text-blue-800 dark:text-blue-300 m-0 leading-relaxed font-medium">
                    {view === 'searches' 
                        ? '💡 Estos logs muestran las búsquedas realizadas por los alumnos. El documento se encuentra ofuscado por privacidad.'
                        : '💡 Historial persistente de cambios realizados en la base de datos por los administradores.'}
                </p>
            </div>
        </div>
    );
};

export default AdminLogsTab;
