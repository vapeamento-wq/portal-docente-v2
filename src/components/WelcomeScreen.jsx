import React from 'react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ fechaEspanol, onAdminAccess }) => {
    return (
        <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="col-span-1 md:col-span-2 text-center py-24 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg rounded-[20px] transition-colors duration-300 relative overflow-hidden"
        >
            <div className="text-8xl mb-5">👨‍🏫</div>
            <h1 className="text-[#003366] dark:text-blue-400 mb-4 text-4xl font-bold">Portal Docente</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
                Gestiona tu programación académica de forma privada y segura.
            </p>

            <div className="mt-10 text-xl text-gray-800 dark:text-gray-200 font-bold capitalize">
                {fechaEspanol}
            </div>
            <div
                className="absolute bottom-5 right-5 cursor-pointer opacity-20 text-xs hover:opacity-100 transition-opacity dark:text-gray-400 text-[#1A1A1A]"
                onClick={onAdminAccess}
            >
                🔒 Acceso Administrativo
            </div>
        </motion.div>
    );
};

export default WelcomeScreen;
