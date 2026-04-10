import React, { useMemo } from 'react';

// ─── Gráfica de barras CSS ────────────────────────────────────────────────────
const BarChart = ({ data, color = '#3b82f6' }) => {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">
            Sin datos disponibles
        </div>
    );
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end gap-1 h-32 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">
                        {d.value > 0 ? d.value : ''}
                    </span>
                    <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                            height: `${Math.max((d.value / max) * 100, d.value > 0 ? 8 : 2)}%`,
                            backgroundColor: d.value > 0 ? color : '#e5e7eb',
                            opacity: i === data.length - 1 ? 1 : 0.7 + (i / data.length) * 0.3,
                        }}
                    />
                    <span className="text-[8px] text-gray-400 dark:text-gray-600 truncate w-full text-center">
                        {d.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Tarjeta de stat ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => (
    <div className={`rounded-2xl p-4 border ${color}`}>
        <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider m-0">{label}</p>
        </div>
        <p className="text-3xl font-black text-gray-800 dark:text-gray-100 m-0">{value ?? 0}</p>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
const AdminStatsTab = ({ fullAnalytics, fullLogs, docentesListLength, docentesListFull, eventsData, statsDateRange, setStatsDateRange }) => {

    // ── Datos para la gráfica de consultas diarias ────────────────────────────
    const chartData = useMemo(() => {
        if (!fullAnalytics || typeof fullAnalytics !== 'object') return [];
        const days = parseInt(statsDateRange) || 7;
        const entries = Object.entries(fullAnalytics)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-days);
        return entries.map(([dateStr, count]) => {
            const [, mm, dd] = dateStr.split('-');
            return { label: `${dd}/${mm}`, value: typeof count === 'number' ? count : 0 };
        });
    }, [fullAnalytics, statsDateRange]);

    // ── Total de consultas en el rango ────────────────────────────────────────
    const totalConsultas = useMemo(() =>
        chartData.reduce((sum, d) => sum + d.value, 0),
        [chartData]
    );

    // ── Eventos ───────────────────────────────────────────────────────────────
    const totalBusquedas = eventsData?.search_docente_success ?? 0;

    // ── Docentes por programa ─────────────────────────────────────────────────
    const byProgram = useMemo(() => {
        if (!docentesListFull || docentesListFull.length === 0) return {};
        return docentesListFull.reduce((acc, d) => {
            const p = d.targetProgram || 'SST';
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, {});
    }, [docentesListFull]);

    const programColors = {
        SST:  { bar: '#ef4444', label: 'SST' },
        AP:   { bar: '#3b82f6', label: 'Adm. Pública' },
        SN:   { bar: '#a855f7', label: 'Nivelación' },
        P500: { bar: '#f59e0b', label: '500×500' },
        VOC:  { bar: '#14b8a6', label: 'Vocacional' },
    };

    const programChartData = Object.entries(byProgram).map(([key, count]) => ({
        label: programColors[key]?.label || key,
        value: count,
        color: programColors[key]?.bar || '#6b7280',
    }));

    return (
        <div className="flex flex-col gap-5 fade-in-up">

            {/* ── KPIs ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                    label="Docentes registrados"
                    value={docentesListLength}
                    icon="👤"
                    color="bg-blue-50/60 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                />
                <StatCard
                    label={`Consultas (${statsDateRange}d)`}
                    value={totalConsultas}
                    icon="🔍"
                    color="bg-purple-50/60 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30"
                />
                <StatCard
                    label="Búsquedas exitosas"
                    value={totalBusquedas}
                    icon="✅"
                    color="bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30"
                />
            </div>

            {/* ── Gráfica de consultas diarias ────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold">
                        📊 Consultas por Día
                    </h4>
                    <div className="flex gap-1.5">
                        {['7', '14', '30'].map(d => (
                            <button
                                key={d}
                                onClick={() => setStatsDateRange(d)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                                    statsDateRange === d
                                        ? 'bg-[#003366] text-white border-[#003366] dark:bg-blue-700 dark:border-blue-700'
                                        : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                                }`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                </div>
                <BarChart data={chartData} color="#3b82f6" />
            </div>

            {/* ── Docentes por programa ───────────────────────────────────── */}
            {programChartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                    <h4 className="m-0 mb-4 text-[#003366] dark:text-blue-400 font-bold">
                        🏫 Docentes por Programa
                    </h4>
                    <div className="flex flex-col gap-2.5">
                        {programChartData.map(p => {
                            const pct = Math.round((p.value / docentesListLength) * 100) || 0;
                            return (
                                <div key={p.label} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-20 text-right shrink-0">
                                        {p.label}
                                    </span>
                                    <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${pct}%`, backgroundColor: p.color }}
                                        />
                                    </div>
                                    <span className="text-xs font-black text-gray-700 dark:text-gray-200 w-10 shrink-0">
                                        {p.value}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Eventos de Firebase ─────────────────────────────────────── */}
            {eventsData && Object.keys(eventsData).length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                    <h4 className="m-0 mb-4 text-[#003366] dark:text-blue-400 font-bold">
                        ⚡ Eventos del Sistema
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(eventsData).map(([key, val]) => (
                            <div key={key} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 m-0">
                                    {key.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-100 m-0">{val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStatsTab;
