import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MigrationBanner = ({ onAdminAccess }) => {
  // Set target date to 8 days from May 15, 2026 -> May 23, 2026
  const [timeLeft, setTimeLeft] = useState({ days: 8, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-05-23T23:59:59').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl p-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500"></div>
        
        <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
          ¡Nos hemos mudado!
        </h1>
        
        <p className="text-lg md:text-xl text-blue-100 mb-8 font-medium leading-relaxed">
          Toda la información ha sido migrada a nuestro nuevo portal. Esta página dejará de funcionar permanentemente en:
        </p>

        <div className="flex justify-center gap-4 md:gap-8 mb-10">
          {[
            { label: 'Días', value: timeLeft.days },
            { label: 'Horas', value: timeLeft.hours },
            { label: 'Minutos', value: timeLeft.minutes },
            { label: 'Segundos', value: timeLeft.seconds }
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner mb-2">
                <span className="text-2xl md:text-4xl font-bold text-white tabular-nums">
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs md:text-sm font-semibold text-blue-200 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>

        <a 
          href="https://asignacion-creo.vercel.app" 
          className="inline-block w-full md:w-auto px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-2xl text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/30 mb-8"
        >
          Ir al Nuevo Portal
        </a>
      </motion.div>

      <button 
        onClick={onAdminAccess}
        className="mt-8 px-6 py-2 text-sm font-semibold text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-full transition-colors backdrop-blur-sm bg-black/10 cursor-pointer"
      >
        Ingreso Administrativo
      </button>
    </div>
  );
};

export default MigrationBanner;
