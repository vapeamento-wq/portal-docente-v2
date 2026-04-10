import React from 'react';

const AdminStatsTab = ({ fullAnalytics }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-[#003366] dark:text-blue-400 mb-4">Estadísticas de Uso</h3>
            <p className="text-gray-600 dark:text-gray-400">Total de peticiones registradas: {fullAnalytics?.length || 0}</p>
        </div>
    );
};

export default AdminStatsTab;
