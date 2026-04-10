import React from 'react';
import { trackAppEvent } from '../services/firebase';

const Header = ({ onReset, docente, searchTerm, setSearchTerm, onSearch, loading }) => {
  return (
    <header className="bg-[#003366] py-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center relative z-10 gap-4 md:gap-0">

        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div
          className="text-center md:text-left flex flex-col justify-center items-center md:items-start cursor-pointer"
          onClick={onReset}
        >
          <div className="flex items-center gap-3 md:gap-6 transform hover:scale-105 transition-all w-full justify-center md:justify-start">
            <div className="flex items-center justify-center shrink-0 w-12 md:w-auto">
              <img
                src="/logo1_450x150.png"
                alt="Escudo Unimagdalena"
                className="h-10 w-auto md:h-16 object-contain"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="text-[#db9b32] text-[17px] sm:text-xl md:text-3xl font-black leading-[1] md:leading-[0.9] tracking-tighter whitespace-nowrap">
                PORTAL DOCENTE
              </h1>
              <h2 className="mt-1 text-[6.5px] sm:text-[8px] md:text-[10px] text-white font-black tracking-[0.1em] sm:tracking-[0.25em] md:tracking-[0.3em] uppercase whitespace-nowrap">
                CREO - UNIVERSIDAD DEL MAGDALENA
              </h2>
            </div>
          </div>

          {/* Links de acceso rápido cuando hay docente activo */}
          {docente && (
            <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
              <a
                href="https://campusvirtual.unimagdalena.edu.co"
                target="_blank"
                rel="noreferrer"
                onClick={e => { e.stopPropagation(); trackAppEvent('click_campus_virtual_docente'); }}
                className="group flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-extrabold shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform text-[#db9b32]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Campus Virtual
              </a>
              <a
                href="https://admisiones.unimagdalena.edu.co/mEstudiantes/indexPrinc.jsp"
                target="_blank"
                rel="noreferrer"
                onClick={e => { e.stopPropagation(); trackAppEvent('click_ayre_docente'); }}
                className="group flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-extrabold shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform text-[#db9b32]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ayre — Docente
              </a>
            </div>
          )}
        </div>

        {/* ── Search / Reset ──────────────────────────────────────────────── */}
        <div className="w-full md:w-auto flex justify-center">
          {!docente && (
            <form
              onSubmit={onSearch}
              className="bg-[#1E293B] p-1.5 rounded-full flex items-center shadow-lg transition-transform w-full max-w-[400px] md:max-w-none md:w-auto mx-auto md:mx-0 border border-slate-700/50 mt-5 md:mt-0"
            >
              <input
                placeholder="Cédula del Docente"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                maxLength={15}
                className="py-2.5 px-4 md:py-3 md:px-6 rounded-l-full border-none outline-none text-[13px] md:text-sm font-medium w-full md:w-[280px] bg-transparent text-white placeholder:text-gray-400 min-w-0"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#db9b32] text-[#003366] border-none py-2 px-5 md:px-8 font-black rounded-full uppercase tracking-widest cursor-pointer hover:bg-[#c68a2e] transition-colors whitespace-nowrap min-w-[100px] md:min-w-[140px] flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md text-[11px] md:text-sm shrink-0"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-[#003366]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : 'CONSULTAR'}
              </button>
            </form>
          )}
          {docente && (
            <button
              onClick={onReset}
              className="bg-[#db9b32] text-[#003366] border-none py-2 px-6 font-extrabold rounded-full uppercase tracking-wider cursor-pointer text-xs hover:bg-[#c68a2e] transition-colors"
            >
              ↺ Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
