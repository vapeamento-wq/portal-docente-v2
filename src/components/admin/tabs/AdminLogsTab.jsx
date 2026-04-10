import React from 'react';

const AdminLogsTab = ({ logs }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
            <h3 className="text-lg font-bold text-[#003366] dark:text-blue-400 mb-4">Logs del Sistema</h3>
            <pre className="text-xs text-gray-400 max-h-96 overflow-y-auto no-scrollbar bg-slate-900 p-4 rounded-xl">
                {JSON.stringify(logs || [], null, 2)}
            </pre>
        </div>
    );
};

export default AdminLogsTab;
