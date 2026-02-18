import React from 'react';

const Header = ({ onReset, docente, searchTerm, setSearchTerm, onSearch, loading }) => {
  return (
    <header className="bg-[#003366] py-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center relative z-10 gap-4 md:gap-0">
        <div className="text-center md:text-left cursor-pointer" onClick={onReset}>
          <h1 className="m-0 text-[#db9b32] text-2xl md:text-3xl font-extrabold tracking-tighter">PORTAL DOCENTES</h1>
          <h2 className="mt-1 text-xs md:text-sm text-white/80 font-medium tracking-[2px] uppercase">PROGRAMA DE ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</h2>
        </div>
        <div className="w-full md:w-auto flex justify-center">
          {!docente && (
            <form onSubmit={onSearch} className="bg-white p-1 rounded-full flex shadow-lg transition-transform w-full md:w-auto">
              <input
                placeholder="Cédula del Docente"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="p-3 px-5 rounded-full border-none outline-none text-base w-full md:w-[200px] bg-transparent"
              />
              <button className="bg-[#db9b32] text-[#003366] border-none py-2 px-6 font-extrabold rounded-full uppercase tracking-wider cursor-pointer hover:bg-[#c68a2e] transition-colors whitespace-nowrap">
                {loading ? '...' : 'CONSULTAR'}
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
