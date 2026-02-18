import React from 'react';
import { getSaludo } from '../utils/helpers';

const Sidebar = ({ docente, selectedCursoIdx, setSelectedCursoIdx }) => {
    return (
        <aside className="sidebar glass-panel">
            <div className="profile-header">
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>{getSaludo()},<br />{docente.nombre.split(' ')[0]}</h3>
                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '5px', background: '#f5f5f5', padding: '3px 10px', borderRadius: '10px' }}>ID: {docente.idReal}</div>
            </div>
            {docente.cursos.map((c, i) => (
                <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--primary)' }}>{c.materia}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>{c.horario || 'Ver Cronograma'}</div>
                    <div className="bloque-badge">{c.bloque}</div>
                </button>
            ))}
        </aside>
    );
};

export default Sidebar;
