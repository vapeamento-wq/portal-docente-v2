import React from 'react';
import { getSaludo } from '../utils/helpers';

const Sidebar = ({ docente, selectedCursoIdx, setSelectedCursoIdx }) => {
    return (
        <aside className="p-8 h-fit animate-[fadeInUp_0.5s_ease-out] w-full md:w-auto flex md:block overflow-x-auto gap-4 md:gap-0 bg-white/95 backdrop-blur-md border border-white/20 shadow-lg rounded-[20px]">
            <div className="hidden md:block text-center mb-8">
                <div className="w-24 h-24 bg-[#db9b32] rounded-full flex items-center justify-center text-4xl text-[#003366] font-bold mx-auto mb-4 shadow-xl border-4 border-white">
                    {docente.nombre.charAt(0)}
                </div>
                <h3 className="m-0 text-[#003366] font-bold text-lg leading-tight">
                    {getSaludo()},<br />{docente.nombre.split(' ')[0]}
                </h3>
                <div className="text-xs text-gray-500 mt-2 bg-gray-100 px-3 py-1 rounded-full inline-block">
                    ID: {docente.idReal}
                </div>
            </div>

            <div className="flex md:block gap-4 md:gap-0">
                {docente.cursos.map((c, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedCursoIdx(i)}
                        className={`w-full min-w-[240px] md:min-w-0 p-4 mb-3 text-left rounded-2xl transition-all duration-200 border cursor-pointer
                            ${selectedCursoIdx === i
                                ? 'bg-white border-[#db9b32] shadow-md ring-1 ring-[#db9b32]/20'
                                : 'bg-transparent border-transparent hover:bg-gray-50'
                            }`}
                    >
                        <div className="font-bold text-[0.95rem] text-[#003366]">{c.materia}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.horario || 'Ver Cronograma'}</div>
                        <div className={`text-[0.65rem] px-2 py-0.5 rounded-md mt-2 font-bold inline-block ${selectedCursoIdx === i ? 'bg-[#003366] text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {c.bloque}
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
