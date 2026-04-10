import React from 'react';

const DatabaseStatusCard = ({ stats }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="m-0 mb-6 text-[#003366] dark:text-blue-400 text-xl font-bold">Bases de Datos Cargadas</h3>
            
            <div className="flex flex-col gap-4">
                {/* SST */}
                <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
                    <h4 className="m-0 mb-2 text-red-900 dark:text-red-400 font-bold">SST</h4>
                    <div className="flex gap-4 text-sm text-red-700 dark:text-red-300">
                        <span className="flex items-center gap-1">👤 {stats.SST.estudiantes} Estudiantes</span>
                        <span className="flex items-center gap-1">📅 {stats.SST.cursos} Horarios</span>
                    </div>
                </div>

                {/* Admón Pública */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl">
                    <h4 className="m-0 mb-2 text-blue-900 dark:text-blue-400 font-bold">Administración Pública</h4>
                    <div className="flex gap-4 text-sm text-blue-700 dark:text-blue-300">
                        <span className="flex items-center gap-1">👤 {stats.AP.estudiantes} Estudiantes</span>
                        <span className="flex items-center gap-1">📅 {stats.AP.cursos} Horarios</span>
                    </div>
                </div>

                {/* Nivelación */}
                <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-4 rounded-xl">
                    <h4 className="m-0 mb-2 text-purple-900 dark:text-purple-400 font-bold">Semestre de Nivelación</h4>
                    <div className="flex gap-4 text-sm text-purple-700 dark:text-purple-300">
                        <span className="flex items-center gap-1">👤 {stats?.SN?.estudiantes || 0} Estudiantes</span>
                        <span className="flex items-center gap-1">📅 {stats?.SN?.cursos || 0} Horarios</span>
                    </div>
                </div>

                {/* 500 X 500 */}
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl mt-4">
                    <h4 className="m-0 mb-2 text-amber-900 dark:text-amber-400 font-bold">500 X 500</h4>
                    <div className="flex gap-4 text-sm text-amber-700 dark:text-amber-300">
                        <span className="flex items-center gap-1">👤 {stats?.P500?.estudiantes || 0} Estudiantes</span>
                        <span className="flex items-center gap-1">📅 {stats?.P500?.cursos || 0} Horarios</span>
                    </div>
                </div>

                {/* Vocacional */}
                <div className="bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 p-4 rounded-xl">
                    <h4 className="m-0 mb-2 text-teal-800 dark:text-teal-400 font-bold flex items-center gap-2">
                        <span>🎓</span> Vocacional
                    </h4>
                    <div className="flex gap-4 text-sm text-teal-700 dark:text-teal-300">
                        <span className="flex items-center gap-1">👤 {stats?.VOC?.docentes || 0} Profes</span>
                        <span className="flex items-center gap-1">📚 {stats?.VOC?.cursos || 0} Cursos</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseStatusCard;
