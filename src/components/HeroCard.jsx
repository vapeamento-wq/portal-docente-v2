import React from 'react';

const HeroCard = ({ cursoActivo }) => {
    if (!cursoActivo) return null;

    return (
        <div className="hero-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px', fontSize: '2.2rem' }}>{cursoActivo.materia}</h1>
                    <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>{cursoActivo.grupo}</div>
                </div>

            </div>
            <div className="hero-info-grid">
                <div className="hero-info-item">📅 <strong>{cursoActivo.fInicio}</strong> (Inicio)</div>
                <div className="hero-info-item">🏁 <strong>{cursoActivo.fFin}</strong> (Fin)</div>
            </div>
        </div>
    );
};

export default HeroCard;
