import React from 'react';

const MaintenanceScreen = ({ onAdminAccess }) => (
  <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-5">
    <div className="text-center max-w-lg fade-in-up">
      <div className="text-7xl mb-6">🔧</div>
      <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
        Portal en <span className="text-[#F15A24]">Mantenimiento</span>
      </h1>
      <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
        Estamos realizando mejoras para brindarte una mejor experiencia.
        Por favor vuelve en unos minutos.
      </p>
      <div className="inline-flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-2xl px-6 py-4">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-slate-300 text-sm font-medium">Trabajando en ello...</span>
      </div>
      {onAdminAccess && (
        <div
          className="mt-16 inline-flex items-center gap-2 cursor-pointer opacity-20 hover:opacity-100 transition-all duration-300 text-slate-500 text-xs px-4 py-2 rounded-full hover:bg-slate-800"
          onClick={onAdminAccess}
        >
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
          🔒 Acceso Administrativo
        </div>
      )}
    </div>
  </div>
);

export default MaintenanceScreen;
