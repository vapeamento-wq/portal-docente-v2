import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AreaChart, Area, PieChart, Pie, Cell, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminStatsTab = ({
    fullAnalytics,
    fullLogs,
    docentesListLength,
    docentesListFull = [],
    eventsData = {},
    statsDateRange,
    setStatsDateRange
}) => {
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const statsData = useMemo(() => {
        let filteredAnalyticsKeys = Object.keys(fullAnalytics || {});
        let filteredLogs = fullLogs || [];
        const now = new Date();

        if (statsDateRange !== 'all') {
            let cutoffDate = new Date();

            if (statsDateRange === '7') cutoffDate.setDate(now.getDate() - 7);
            else if (statsDateRange === '30') cutoffDate.setDate(now.getDate() - 30);
            else if (statsDateRange === 'custom') {
                const sDate = new Date(customStartDate || '2000-01-01');
                const eDate = new Date(customEndDate || '2100-01-01');
                eDate.setHours(23, 59, 59, 999);

                filteredAnalyticsKeys = filteredAnalyticsKeys.filter(dateStr => {
                    const d = new Date(dateStr);
                    return d >= sDate && d <= eDate;
                });

                filteredLogs = (fullLogs || []).filter(log => {
                    if (!log.fecha) return false;
                    const [datePart] = log.fecha.split(',');
                    if (!datePart) return false;
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
                        return d >= sDate && d <= eDate;
                    }
                    return true;
                });
            }

            if (statsDateRange === '7' || statsDateRange === '30') {
                filteredAnalyticsKeys = filteredAnalyticsKeys.filter(dateStr => new Date(dateStr) >= cutoffDate);
                filteredLogs = (fullLogs || []).filter(log => {
                    if (!log.fecha) return false;
                    const [datePart] = log.fecha.split(',');
                    if (!datePart) return false;
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
                        return d >= cutoffDate;
                    }
                    return true;
                });
            }
        }

        const analyticsList = filteredAnalyticsKeys
            .map(k => ({ date: k, count: fullAnalytics[k] }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalConsultas = analyticsList.reduce((sum, item) => sum + item.count, 0);
        const promDiario = analyticsList.length > 0 ? Math.round(totalConsultas / analyticsList.length) : 0;

        let diaRecord = { date: '-', count: 0 };
        analyticsList.forEach(item => {
            if (item.count > diaRecord.count) diaRecord = item;
        });

        let exitosas = 0;
        let fallidas = 0;
        filteredLogs.forEach(log => {
            if (log.estado && log.estado.includes('❌')) fallidas++;
            else exitosas++;
        });

        const chartData = analyticsList.map(item => {
            const [yyyy, mm, dd] = item.date.split('-');
            return { name: `${dd}/${mm}`, consultas: item.count, fullDate: item.date };
        });

        const pieData = [
            { name: 'Exitosas', value: exitosas },
            { name: 'Fallidas', value: fallidas }
        ];

        // ── EVENTOS DE BOTONES ──
        let totalCampus = 0;
        let totalAyre = 0;

        const dateIsValid = (dateStr) => {
            if (statsDateRange === 'all') return true;
            const d = new Date(`${dateStr}T00:00:00`);
            let cutoffDate = new Date();
            if (statsDateRange === '7') cutoffDate.setDate(new Date().getDate() - 7);
            else if (statsDateRange === '30') cutoffDate.setDate(new Date().getDate() - 30);
            else if (statsDateRange === 'custom') {
                const sDate = new Date(customStartDate || '2000-01-01');
                const eDate = new Date(customEndDate || '2100-01-01');
                eDate.setHours(23, 59, 59, 999);
                return d >= sDate && d <= eDate;
            }
            return d >= cutoffDate;
        };

        if (eventsData?.click_campus_virtual) {
            Object.keys(eventsData.click_campus_virtual).forEach(k => {
                if (dateIsValid(k)) totalCampus += eventsData.click_campus_virtual[k];
            });
        }
        if (eventsData?.click_ayre_estudiante) {
            Object.keys(eventsData.click_ayre_estudiante).forEach(k => {
                if (dateIsValid(k)) totalAyre += eventsData.click_ayre_estudiante[k];
            });
        }

        // ── ESTUDIANTES INACTIVOS ──
        const inactivos = (docentesListFull || []).filter(doc => !doc.ultimoAcceso);

        return {
            totalConsultas,
            promDiario,
            diaRecord: diaRecord.count > 0 ? `${diaRecord.date.split('-').reverse().join('/')} (${diaRecord.count})` : 'N/A',
            chartData,
            pieData,
            exitosas,
            fallidas,
            filteredLogs,
            totalCampus,
            totalAyre,
            inactivos
        };
    }, [fullAnalytics, fullLogs, statsDateRange, customStartDate, customEndDate, eventsData, docentesListFull]);

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        const wsResumen = XLSX.utils.aoa_to_sheet([
            ['Métrica', 'Valor'],
            ['Total Consultas', statsData.totalConsultas],
            ['Promedio Diario', statsData.promDiario],
            ['Día Récord', statsData.diaRecord],
            ['Total Estudiantes', docentesListLength],
            ['Inactivos (Nunca Entraron)', statsData.inactivos.length],
            ['Búsquedas Exitosas', statsData.exitosas],
            ['Búsquedas Fallidas', statsData.fallidas],
            ['Clicks Campus Virtual', statsData.totalCampus],
            ['Clicks Ayre', statsData.totalAyre]
        ]);
        wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen_Ejecutivo');

        if (statsData.inactivos.length > 0) {
            const formatInactivos = statsData.inactivos.map(doc => ({
                'Documento/Hash': doc.hashId,
                'Nombre Estudiante': doc.nombre,
                'Programa': doc.targetProgram || doc.programa || 'Sin Asignar'
            }));
            const wsInactivos = XLSX.utils.json_to_sheet(formatInactivos);
            wsInactivos['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 25 }];
            XLSX.utils.book_append_sheet(wb, wsInactivos, 'Estudiantes_Inactivos');
        }

        const formatTendencia = statsData.chartData.map(item => ({
            'Fecha': item.fullDate,
            'Volumen de Consultas': item.consultas
        }));
        const wsTendencia = XLSX.utils.json_to_sheet(formatTendencia);
        wsTendencia['!cols'] = [{ wch: 15 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsTendencia, 'Tendencia_Diaria');

        const formatLogs = statsData.filteredLogs.map(log => ({
            'Fecha y Hora': log.fecha,
            'Documento / Código': log.doc,
            'Estado': log.estado,
            'ID Registro': log.id
        }));
        const wsLogs = XLSX.utils.json_to_sheet(formatLogs);
        wsLogs['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsLogs, 'Auditoria_Logs');

        XLSX.writeFile(wb, `Reporte_Estadisticas_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="grid grid-cols-1 gap-6 fade-in-up">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-xl">📊 Dashboard Analítico</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitorea el uso y salud del portal en tiempo real.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                        value={statsDateRange}
                        onChange={(e) => setStatsDateRange(e.target.value)}
                        className="p-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#003366] transition-colors"
                    >
                        <option value="7">Últimos 7 Días</option>
                        <option value="30">Últimos 30 Días</option>
                        <option value="all">Histórico Completo</option>
                        <option value="custom">Rango Personalizado</option>
                    </select>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                        📥 Descargar Reporte Completo
                    </button>
                </div>
            </div>

            {statsDateRange === 'custom' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Fecha Inicio</label>
                        <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="p-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Fecha Fin</label>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="p-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-sm"
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Consultas Principales */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Total Búsquedas</h5>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-[#003366] dark:text-blue-400 group-hover:scale-105 transition-transform origin-left">{statsData.totalConsultas}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Día Récord</h5>
                    <div className="flex items-end gap-3">
                        <span className="text-2xl font-extrabold text-[#007bff] dark:text-blue-300 group-hover:scale-105 transition-transform origin-left truncate">{statsData.diaRecord}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Tasa de Éxito</h5>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-emerald-500 dark:text-emerald-400 group-hover:scale-105 transition-transform origin-left">
                            {statsData.exitosas + statsData.fallidas > 0
                                ? Math.round((statsData.exitosas / (statsData.exitosas + statsData.fallidas)) * 100)
                                : 0}%
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Promedio Diario</h5>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 group-hover:scale-105 transition-transform origin-left">{statsData.promDiario}</span>
                    </div>
                </div>

                {/* 2. Clicks & Events */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Campus Virtual (Clicks)</h5>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-[#db9b32] dark:text-amber-400 group-hover:scale-105 transition-transform origin-left">{statsData.totalCampus}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                    <h5 className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Ayre Estudiante (Clicks)</h5>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-indigo-500 dark:text-indigo-400 group-hover:scale-105 transition-transform origin-left">{statsData.totalAyre}</span>
                    </div>
                </div>

                <div className="sm:col-span-2 bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-all group">
                    <h5 className="text-sm text-red-800 dark:text-red-400 font-bold uppercase tracking-wider mb-2">Estudiantes Inactivos (Nunca han entrado)</h5>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-red-600 dark:text-red-500 group-hover:scale-105 transition-transform origin-left">{statsData.inactivos.length}</span>
                        <span className="text-sm font-medium text-red-400 mb-1">de {docentesListLength} registrados</span>
                    </div>
                    {statsData.inactivos.length > 0 && (
                        <p className="text-xs text-red-700 dark:text-red-300 mt-2 font-medium">Exporta "Reporte Completo" para ver la lista de inactivos en Excel.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 h-[350px] shadow-sm">
                    <h4 className="text-[#003366] dark:text-blue-400 font-bold text-lg mb-6">📈 Tendencia Histórica</h4>
                    <ResponsiveContainer width="100%" height="85%">
                        {statsData.chartData.length > 0 ? (
                            <AreaChart data={statsData.chartData}>
                                <defs>
                                    <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#007bff" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#007bff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={12} stroke="#888" tickMargin={10} />
                                <YAxis fontSize={12} stroke="#888" allowDecimals={false} />
                                <Tooltip
                                    cursor={{ stroke: '#007bff', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="consultas" stroke="#007bff" strokeWidth={3} fillOpacity={1} fill="url(#colorConsultas)" activeDot={{ r: 8 }} />
                            </AreaChart>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium">No hay datos en este rango de fechas.</div>
                        )}
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 h-[350px] shadow-sm flex flex-col">
                    <h4 className="text-[#003366] dark:text-blue-400 font-bold text-lg mb-2">🎯 Efectividad de Búsqueda</h4>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            {statsData.exitosas + statsData.fallidas > 0 ? (
                                <PieChart>
                                    <Pie
                                        data={statsData.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium">Sin búsquedas registradas.</div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStatsTab;
