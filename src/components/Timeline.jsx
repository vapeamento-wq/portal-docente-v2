import React from 'react';
import { registrarLog } from '../utils/helpers';

const Timeline = ({ cursoActivo, docenteId }) => {
    if (!cursoActivo) return null;

    return (
        <div className="p-10 bg-white rounded-[30px] shadow-sm">
            <h3 className="text-[#003366] mb-8 text-xl font-bold">Cronograma de Actividades</h3>
            {cursoActivo.semanas.map((s, idx) => (
                <div key={idx} className={`flex gap-6 mb-8 relative group ${s.status === 'past' ? 'opacity-60' : ''}`}>
                    {/* Line */}
                    <div className={`absolute left-[23px] top-12 -bottom-8 w-[3px] ${s.status === 'present' ? 'bg-[#25D366]' :
                            s.status === 'future' ? 'bg-[#003366]' : 'bg-gray-200'
                        }`}></div>

                    {/* Date Circle */}
                    <div className={`w-[50px] h-[50px] rounded-full border-[3px] flex flex-col items-center justify-center font-bold z-10 transition-colors
                        ${s.status === 'present' ? 'bg-[#25D366] border-[#25D366] text-white shadow-[0_5px_15px_rgba(37,211,102,0.2)]' :
                            s.status === 'future' ? 'bg-[#003366] border-[#003366] text-white' :
                                'bg-[#f5f5f5] border-gray-200 text-gray-300'
                        }`}>
                        <span className="text-[0.65rem]">SEM</span>
                        <span className="text-xl leading-none">{s.num}</span>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 p-6 rounded-2xl border transition-all duration-300
                        ${s.status === 'present' ? 'bg-white border-[#25D366] shadow-[0_10px_25px_rgba(37,211,102,0.15)] scale-[1.02]' :
                            s.status === 'past' ? 'bg-gray-50/50 border-transparent' :
                                'bg-gray-50 border-gray-100 hover:bg-white hover:border-[#db9b32] hover:shadow-lg'
                        }`}>

                        <div className="flex justify-between items-center mb-2">
                            <div className="font-bold text-lg text-gray-800">{s.fecha}</div>
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
                            <div className="inline-block bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-bold mt-2 border border-blue-100">🏠 {s.displayTexto}</div>
                        ) : s.tipo === 'PRESENCIAL' ? (
                            <div className="inline-block bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-bold mt-2 border border-blue-100">🏫 {s.displayTexto} <br /> ⏰ {s.hora}</div>
                        ) : (
                            <>
                                <div className="text-gray-500 mt-1">⏰ {s.hora}</div>
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
                </div>
            ))}
        </div>
    );
};

export default Timeline;
