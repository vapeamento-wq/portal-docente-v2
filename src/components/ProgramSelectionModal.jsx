import React from 'react';
import { motion } from 'framer-motion';

const ProgramSelectionModal = ({ programas, onSelect, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-none border border-gray-100 dark:border-slate-700"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📚</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#003366] dark:text-blue-400 m-0 mb-2">Selecciona tu Programa</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm m-0">
                        Hemos detectado que tienes clases asignadas en múltiples programas. ¿Cuál deseas consultar en este momento?
                    </p>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                    {programas.map((prog, index) => (
                        <button
                            key={index}
                            onClick={() => onSelect(prog)}
                            className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between group"
                        >
                            <span>{prog === 'SST' ? 'SST (Seguridad y Salud)' : prog}</span>
                            <span className="text-blue-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                                →
                            </span>
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                    Volver al Inicio
                </button>
            </motion.div>
        </div>
    );
};

export default ProgramSelectionModal;
