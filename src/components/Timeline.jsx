import React from 'react';
import { registrarLog } from '../utils/helpers';

const Timeline = ({ cursoActivo, docenteId }) => {
    if (!cursoActivo) return null;

    return (
        <div className="timeline-container glass-panel">
            <h3 style={{ color: 'var(--primary)', marginBottom: '30px' }}>Cronograma de Actividades</h3>
            {cursoActivo.semanas.map((s, idx) => (
                <div key={idx} className={`timeline-item ${s.status}`}>
                    <div className="timeline-line"></div>
                    <div className="date-circle">
                        <span style={{ fontSize: '0.65rem' }}>SEM</span>
                        <span style={{ fontSize: '1.3rem' }}>{s.num}</span>
                    </div>
                    <div className="timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{s.fecha}</div>
                            {s.status === 'present' && <span style={{ background: '#25D366', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>HOY</span>}
                        </div>

                        {s.tipo === 'INDEPENDIENTE' ? (
                            <div className="offline-badge">🏠 {s.displayTexto}</div>
                        ) : s.tipo === 'PRESENCIAL' ? (
                            <div className="offline-badge">🏫 {s.displayTexto} <br /> ⏰ {s.hora}</div>
                        ) : (
                            <>
                                <div style={{ color: '#666', marginTop: '5px' }}>⏰ {s.hora}</div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                    {s.zoomLink && (
                                        <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-mini-btn" onClick={() => registrarLog(docenteId, `🎥 Zoom Sem ${s.num}`)}>
                                            🎥 Unirse
                                        </a>
                                    )}

                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Timeline;
