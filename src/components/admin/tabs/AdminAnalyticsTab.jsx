import React, { useState } from 'react';
import AdminStatsTab from './AdminStatsTab';
import AdminLogsTab from './AdminLogsTab';

const AdminAnalyticsTab = ({
    fullAnalytics, fullLogs, docentesListLength, docentesListFull,
    eventsData, statsDateRange, setStatsDateRange, logs,
}) => {
    const [subTab, setSubTab] = useState('stats');

    const SubTabBtn = ({ id, label }) => (
        <button
            onClick={() => setSubTab(id)}
            className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                subTab === id
                    ? 'bg-white dark:bg-slate-800 text-[#003366] dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col gap-5 fade-in-up">
            {/* Sub-tabs internos */}
            <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl border border-gray-200 dark:border-slate-600 max-w-xs">
                <SubTabBtn id="stats" label="📊 Estadísticas" />
                <SubTabBtn id="logs"  label="📝 Logs" />
            </div>

            {subTab === 'stats' && (
                <AdminStatsTab
                    fullAnalytics={fullAnalytics}
                    fullLogs={fullLogs}
                    docentesListLength={docentesListLength}
                    docentesListFull={docentesListFull}
                    eventsData={eventsData}
                    statsDateRange={statsDateRange}
                    setStatsDateRange={setStatsDateRange}
                />
            )}
            {subTab === 'logs' && (
                <AdminLogsTab logs={logs} />
            )}
        </div>
    );
};

export default AdminAnalyticsTab;
