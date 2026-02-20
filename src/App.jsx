import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] dark:bg-slate-900 font-sans p-5">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-2xl rounded-[30px] p-10 max-w-lg w-full text-center animate-[fadeInUp_0.6s_ease-out_forwards]">
        <div className="text-6xl mb-6">⚙️</div>
        <h1 className="text-[#003366] dark:text-blue-400 mb-4 text-3xl font-extrabold">Portal en Mantenimiento</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
          Estamos realizando actualizaciones importantes en el sistema para mejorar tu experiencia.<br /><br />
          Por favor, intenta ingresar nuevamente más tarde.
        </p>
        <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 p-4 rounded-xl text-sm font-bold">
          Disculpa las molestias ocasionadas.
        </div>
      </div>
    </div>
  );
};

export default App;
