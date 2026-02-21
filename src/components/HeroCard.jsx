import React from 'react';
import { motion } from 'framer-motion';

const HeroCard = ({ cursoActivo }) => {
    if (!cursoActivo) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-[#003366] to-[#004080] text-white p-10 rounded-[30px] relative overflow-hidden mb-10 shadow-[0_20px_40px_rgba(0,51,102,0.3)]"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="m-0 mb-2 text-4xl font-normal">{cursoActivo.materia}</h1>
                    <div className="text-lg opacity-90">{cursoActivo.grupo}</div>
                </div>

            </div>
            <div className="flex gap-5 mt-6 flex-wrap bg-black/25 p-4 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 font-medium text-[0.95rem]">📅 <strong>{cursoActivo.fInicio}</strong> (Inicio)</div>
                <div className="flex items-center gap-2 font-medium text-[0.95rem]">🏁 <strong>{cursoActivo.fFin}</strong> (Fin)</div>
            </div>
        </motion.div>
    );
};

export default HeroCard;
