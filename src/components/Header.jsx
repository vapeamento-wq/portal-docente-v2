import React from 'react';

const Header = ({ onReset, docente, searchTerm, setSearchTerm, onSearch, loading }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="brand" onClick={onReset} style={{ cursor: 'pointer' }}>
          <h1>PORTAL DOCENTES</h1>
          <h2>PROGRAMA DE ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO </h2>
        </div>
        <div className="actions">
          {!docente && (
            <form onSubmit={onSearch} className="search-container">
              <input placeholder="Cédula del Docente" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
              <button className="btn-search rounded-btn">{loading ? '...' : 'CONSULTAR'}</button>
            </form>
          )}
          {docente && <button onClick={onReset} className="btn-search rounded-btn" style={{ fontSize: '0.75rem', padding: '10px 20px' }}>↺ Salir</button>}
        </div>
      </div>
    </header>
  );
};

export default Header;
