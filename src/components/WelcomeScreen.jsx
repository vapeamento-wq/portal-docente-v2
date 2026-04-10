import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ onAdminAccess }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatoFecha = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  }).format(currentTime);

  const formatoHora = new Intl.DateTimeFormat('es-CO', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(currentTime);

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full text-center pt-8 md:pt-12 pb-20 transition-all duration-500 flex flex-col items-center"
    >
      {/* ── Tarjeta Principal ──────────────────────────────────────────── */}
      <div className="w-[95%] md:w-full max-w-6xl bg-[#1E293B] rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-2xl border border-slate-700/50">

        {/* Imagen del campus */}
        <div className="relative w-full h-[180px] sm:h-[250px] md:h-[450px] rounded-2xl overflow-hidden shadow-inner mb-8 md:mb-10 group">
          <img
            src="/entrada_principal.jpg"
            alt="Campus Unimagdalena"
            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 brightness-[0.85] group-hover:brightness-100"
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback si no hay imagen */}
          <div
            className="absolute inset-0 bg-[#003366] items-center justify-center hidden"
            style={{ display: 'none' }}
          >
            <span className="text-6xl">🎓</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 via-[#0f172a]/30 to-transparent flex flex-col justify-end p-6 md:p-10 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 mb-2 md:mb-4 w-max">
              <span className="text-blue-200 text-[8px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                ✨ PLAN DE DESARROLLO 2030
              </span>
            </div>
            <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-black leading-tight drop-shadow-2xl">
              <span className="text-[#F15A24]">UNIMAGDALENA</span> <br />
              <span className="text-blue-300">COMPROMETIDA</span>
            </h2>
          </div>
        </div>

        {/* Frase Institucional */}
        <div className="mb-8 md:mb-10 px-2 md:px-4">
          <h3 className="text-[17px] md:text-2xl font-bold italic text-blue-300 drop-shadow-sm leading-snug md:leading-normal">
            "Ser docente es creer en el potencial de cada ser humano."
          </h3>
        </div>

        {/* Fecha y Hora en Vivo */}
        <div className="mb-4 md:mb-8 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3">
          <p className="text-[17px] md:text-xl font-black text-white capitalize tracking-wide">
            {formatoFecha}
          </p>
          <span className="hidden md:block text-slate-500 font-bold">•</span>
          <p className="text-[17px] md:text-xl font-bold text-[#F15A24] uppercase tracking-widest">
            {formatoHora.replace('.', '').replace('.', '')}
          </p>
        </div>
      </div>

      {/* Instrucción */}
      <div className="mt-10 px-6 max-w-2xl text-center">
        <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
          Por favor, <strong className="text-white font-bold underline decoration-slate-600 underline-offset-4">ingresa tu número de cédula</strong> en la barra superior para consultar tu programación académica.
        </p>
      </div>

      {/* Botón de Acceso Administrativo */}
      <div
        className="mt-16 inline-flex items-center gap-2 cursor-pointer opacity-30 hover:opacity-100 transition-all duration-300 text-slate-500 text-xs px-4 py-2 rounded-full hover:bg-slate-800"
        onClick={onAdminAccess}
      >
        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
        🔒 Acceso Administrativo
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
