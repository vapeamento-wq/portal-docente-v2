import React from 'react';
import { motion } from 'framer-motion';
import { registrarLog } from '../utils/helpers';

const Timeline = ({ cursoActivo, docenteId }) => {
    if (!cursoActivo) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-10 bg-white dark:bg-slate-800 rounded-[30px] shadow-sm transition-colors duration-300"
        >
            <h3 className="text-[#003366] dark:text-blue-400 mb-8 text-xl font-bold transition-colors">Cronograma de Actividades</h3>
            {cursoActivo.semanas.map((s, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className={`flex gap-6 mb-8 relative group ${s.status === 'past' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                    {/* Line */}
                    <div className={`absolute left-[23px] top-12 -bottom-8 w-[3px] transition-colors ${s.status === 'present' ? 'bg-[#25D366]' :
                        s.status === 'future' ? 'bg-[#003366] dark:bg-blue-500' : 'bg-gray-200 dark:bg-slate-700'
                        }`}></div>

                    {/* Date Circle */}
                    <div className={`w-[50px] h-[50px] rounded-full border-[3px] flex flex-col items-center justify-center font-bold z-10 transition-colors
                        ${s.status === 'present' ? 'bg-[#25D366] border-[#25D366] text-white shadow-[0_5px_15px_rgba(37,211,102,0.2)]' :
                            s.status === 'future' ? 'bg-[#003366] dark:bg-blue-500 border-[#003366] dark:border-blue-500 text-white' :
                                'bg-[#f5f5f5] border-gray-200 text-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-500'
                        }`}>
                        <span className="text-[0.65rem]">SEM</span>
                        <span className="text-xl leading-none">{s.num}</span>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 p-6 rounded-2xl border transition-all duration-300
                        ${s.status === 'present' ? 'bg-white dark:bg-slate-700 border-[#25D366] shadow-[0_10px_25px_rgba(37,211,102,0.15)] scale-[1.02]' :
                            s.status === 'past' ? 'bg-gray-50/50 dark:bg-slate-800/50 border-transparent' :
                                'bg-gray-50 border-gray-100 dark:bg-slate-700/30 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 hover:border-[#db9b32] dark:hover:border-yellow-500 hover:shadow-lg'
                        }`}>

                        <div className="flex justify-between items-center mb-2">
                            <div className="font-bold text-lg text-gray-800 dark:text-gray-200 transition-colors">{s.fecha}</div>
                            {(() => {
                                if (s.status === 'present' || s.status === 'future') {
                                    const today = new Date();
                                    const eventDate = s.fechaObj ? new Date(s.fechaObj) : null;

                                    if (!eventDate) return null;
                                    today.setHours(0, 0, 0, 0);
                                    eventDate.setHours(0, 0, 0, 0);

                                    const diffTime = eventDate - today;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    if (diffDays === 0) return <span className="bg-[#25D366] text-white text-[0.7rem] px-2 py-0.5 rounded-lg font-bold">HOY</span>;
                                    if (diffDays === 1) return <span className="bg-[#007bff] text-white text-[0.7rem] px-2 py-0.5 rounded-lg font-bold">MAÑANA</span>;
                                    if (diffDays > 1) return <span className="bg-[#007bff] text-white text-[0.7rem] px-2 py-0.5 rounded-lg font-bold">Faltan {diffDays} días</span>;
                                }
                                return null;
                            })()}
                        </div>

                        {s.tipo === 'INDEPENDIENTE' ? (
                            <div className="inline-block bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-full text-sm font-bold mt-2 border border-blue-100 transition-colors">🏠 {s.displayTexto}</div>
                        ) : s.tipo === 'PRESENCIAL' ? (
                            <div className="inline-block bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-full text-sm font-bold mt-2 border border-blue-100 transition-colors">🏫 {s.displayTexto} <br /> ⏰ {s.hora}</div>
                        ) : (
                            <>
                                <div className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">⏰ {s.hora}</div>
                                <div className="flex gap-2 flex-wrap mt-3">
                                    {s.zoomLink && (
                                        <a href={s.zoomLink} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-2 bg-[#2D8CFF] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-600 transition-colors decoration-0"
                                            onClick={() => registrarLog(docenteId, `🎥 Zoom Sem ${s.num}`)}>
                                            🎥 Unirse
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default Timeline;
