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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="sticky top-6 z-30 bg-gradient-to-br from-[#003366] to-[#004080] text-white p-6 md:p-10 rounded-[30px] relative overflow-hidden mb-6 shadow-[0_20px_40px_rgba(0,51,102,0.3)] border border-white/10"
        >
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="m-0 mb-1 text-3xl md:text-4xl font-extrabold tracking-tight">{cursoActivo.materia}</h1>
                    <div className="text-lg md:text-xl opacity-90 font-medium">{cursoActivo.grupo}</div>
                </div>
                {progress > 0 && (
                    <div className="hidden sm:block text-right">
                        <div className="text-2xl font-bold">{progress}%</div>
                        <div className="text-[10px] uppercase tracking-widest opacity-70">Progreso</div>
                    </div>
                )}
            </div>

            <div className="mt-6">
                <div className="flex justify-between text-xs mb-2 opacity-80 font-bold uppercase tracking-wider">
                    <span>Avance del Curso</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-[#db9b32] to-[#f4b953] shadow-[0_0_15px_rgba(219,155,50,0.4)]"
                    />
                </div>
            </div>

            <div className="flex gap-4 md:gap-8 mt-6 flex-wrap bg-white/10 p-3 md:p-4 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2 text-sm">
                    <span className="opacity-70">Inicio:</span>
                    <strong className="font-bold">{formatHeaderDate(cursoActivo.fInicio)}</strong>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="opacity-70">Fin:</span>
                    <strong className="font-bold">{formatHeaderDate(cursoActivo.fFin)}</strong>
                </div>
            </div>
        </motion.div>
    );
};

export default HeroCard;
