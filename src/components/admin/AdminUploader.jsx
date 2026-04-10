import React from 'react';

const AdminUploader = ({ onFileUpload, uploading, uploadResult, onDelete }) => {
    const [selectedProgram, setSelectedProgram] = React.useState('SST');
    const [uploadMode, setUploadMode] = React.useState('students'); // 'students' or 'schedules'

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
            <h3 className="m-0 mb-6 text-slate-800 dark:text-blue-400 font-bold flex items-center justify-center gap-2">
                <span className="text-2xl">{uploadMode === 'students' ? '📥' : '📅'}</span> 
                {uploadMode === 'students' ? 'Actualizar Docentes' : 'Actualizar Horarios'}
            </h3>

            {/* Selector de Modo */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-6 max-w-[280px] mx-auto border border-slate-300 dark:border-slate-700">
                <button
                    onClick={() => setUploadMode('students')}
                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${uploadMode === 'students' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-500'}`}
                >Docentes</button>
                <button
                    onClick={() => setUploadMode('schedules')}
                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${uploadMode === 'schedules' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-500'}`}
                >Horarios</button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-tight">
                {uploadMode === 'students' 
                    ? 'Sube el Excel de un programa. El sistema lo analizará y lo fusionará sin borrar los demás programas.' 
                    : 'Sincroniza el cronograma de 16 semanas desde el Excel de horarios.'}
            </p>

            <div className="mb-6 text-left">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2">
                    Programa Destino
                </label>
                <select 
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    disabled={uploading}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                >
                    <option value="SST">SST (Seguridad y Salud)</option>
                    <option value="AP">Administración Pública</option>
                    <option value="SN">Semestre de Nivelación</option>
                    <option value="P500">500 X 500</option>
                    <option value="VOC">Vocacional</option>
                </select>
                <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    Elige a qué categoría pertenecen los estudiantes de este archivo.
                </p>
            </div>

            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => onFileUpload(e, selectedProgram, uploadMode)}
                disabled={uploading}
                className="block mx-auto mb-4 text-sm text-transparent w-full max-w-[200px]
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
                    disabled={uploading}
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
