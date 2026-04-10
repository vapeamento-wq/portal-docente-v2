import React from 'react';

const PROGRAMAS = [
    { value: 'SST',  label: 'SST (Seguridad y Salud)' },
    { value: 'AP',   label: 'Administración Pública' },
    { value: 'SN',   label: 'Semestre de Nivelación' },
    { value: 'P500', label: '500 X 500' },
    { value: 'VOC',  label: 'Vocacional' },
];

const AdminUploader = ({ onFileUpload, uploading, uploadResult, onDelete }) => {
    const [selectedProgram, setSelectedProgram] = React.useState('SST');

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
            <h3 className="m-0 mb-2 text-slate-800 dark:text-blue-400 font-bold flex items-center justify-center gap-2">
                <span className="text-2xl">📥</span>
                Actualizar BD (Desde Excel)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-tight">
                Sube el archivo Excel de un programa. El sistema lo analizará y lo fusionará sin borrar los demás programas.
            </p>

            {/* Selector de programa */}
            <div className="mb-5 text-left">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2">
                    Programa Académico:
                </label>
                <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    disabled={uploading}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                >
                    {PROGRAMAS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
                {!selectedProgram && (
                    <p className="text-red-500 text-xs font-bold mt-2">
                        Paso 1: Selecciona un programa para habilitar la carga.
                    </p>
                )}
            </div>

            {/* Botón de carga */}
            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => {
                    if (!selectedProgram) {
                        alert('Selecciona un programa primero.');
                        e.target.value = '';
                        return;
                    }
                    onFileUpload(e, selectedProgram, 'unified');
                }}
                disabled={uploading || !selectedProgram}
                className="block mx-auto mb-4 text-sm text-transparent w-full max-w-[220px]
                    file:mr-0 file:py-3 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-bold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700 transition-colors cursor-pointer disabled:cursor-not-allowed dark:file:bg-blue-500 dark:file:hover:bg-blue-400
                    file:mx-auto file:block"
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

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                <button
                    onClick={() => onDelete(selectedProgram)}
                    disabled={uploading || !selectedProgram}
                    className="w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm transition-colors border-none cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    🗑️ Borrar Datos: {selectedProgram}
                </button>
                <p className="text-[10px] text-gray-400 mt-2 italic">Solo usar en caso de emergencia o reinicio de semestre.</p>
            </div>
        </div>
    );
};

export default AdminUploader;
