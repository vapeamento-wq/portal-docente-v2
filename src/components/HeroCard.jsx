import React from 'react';
import { motion } from 'framer-motion';

const HeroCard = ({ cursoActivo }) => {
    if (!cursoActivo) return null;

    const formatHeaderDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.toString().trim().split('/');
        if (parts.length === 3) {
            let p0 = parseInt(parts[0], 10);
            let p1 = parseInt(parts[1], 10);
            let yearNum = parts[2].trim();

            let monthNum, dayNum;
            if (p0 > 12) {
                dayNum = p0;
                monthNum = p1;
            } else if (p1 > 12) {
                monthNum = p0;
                dayNum = p1;
            } else {
                monthNum = p0; // usually MM/DD/YY
                dayNum = p1;
            }

            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            if (monthNum >= 1 && monthNum <= 12) {
                return `${dayNum} / ${meses[monthNum - 1]} / ${yearNum}`;
            }
        }
        return dateStr;
    };

    const getProgress = () => {
        if (!cursoActivo?.fInicio || !cursoActivo?.fFin) return 0;

        const parseDateParts = (dateStr) => {
            if (!dateStr) return null;
            const parts = dateStr.toString().trim().split('/');
            if (parts.length !== 3) return null;

            let p0 = parseInt(parts[0], 10);
            let p1 = parseInt(parts[1], 10);
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;

            let month, day;
            if (p0 > 12) { day = p0; month = p1; }
            else if (p1 > 12) { month = p0; day = p1; }
            else { month = p0; day = p1; } // default MM/DD

            return new Date(year, month - 1, day);
        };

        try {
            const start = parseDateParts(cursoActivo.fInicio);
            const end = parseDateParts(cursoActivo.fFin);
            const now = new Date();

            if (!start || !end) return 0;
            if (now < start) return 0;
            if (now > end) return 100;

            return Math.min(Math.round(((now - start) / (end - start)) * 100), 100);
        } catch { return 0; }
    };

    const progress = getProgress();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-[#003366] to-[#004080] text-white p-5 md:p-6 rounded-2xl relative overflow-hidden shadow-lg border border-white/10"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex-1">
                    <h1 className="m-0 text-xl md:text-2xl font-black tracking-tight leading-tight">{cursoActivo.materia}</h1>
                    <div className="text-xs md:text-sm opacity-80 font-bold uppercase tracking-wider mt-1">{cursoActivo.grupo}</div>
                </div>
                {progress >= 0 && (
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Avance del curso</span>
                            <div className="text-sm font-black">{progress}%</div>
                        </div>
                        <div className="w-16 h-1.5 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-gradient-to-r from-[#db9b32] to-[#f4b953]"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-[10px] md:text-xs">
                    <span className="opacity-60 font-bold uppercase">Inicio:</span>
                    <strong className="font-bold">{formatHeaderDate(cursoActivo.fInicio)}</strong>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs">
                    <span className="opacity-60 font-bold uppercase">Fin:</span>
                    <strong className="font-bold">{formatHeaderDate(cursoActivo.fFin)}</strong>
                </div>
            </div>
        </motion.div>
    );
};

export default HeroCard;
