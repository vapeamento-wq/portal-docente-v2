import React from 'react';

const NotFoundScreen = ({ searchId, onReset }) => (
  <div className="min-h-[50vh] flex items-center justify-center px-5">
    <div className="text-center max-w-lg fade-in-up py-16">
      <div className="text-7xl mb-6">😔</div>
      <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
        Docente no encontrado
      </h2>
      {searchId && (
        <p className="text-slate-500 text-sm mb-2 font-mono">
          ID consultado: <span className="text-slate-300">{searchId}</span>
        </p>
      )}
      <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8">
        No encontramos ningún docente con ese número de cédula en el sistema.<br />
        Verifica el número e intenta nuevamente.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 bg-[#003366] hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-full transition-colors cursor-pointer border-none shadow-lg"
      >
        ↺ Realizar otra consulta
      </button>
    </div>
  </div>
);

export default NotFoundScreen;
