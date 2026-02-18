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
                            {(() => {
                                if (s.status === 'present' || s.status === 'future') {
                                    const today = new Date();
                                    const eventDate = s.fechaObj ? new Date(s.fechaObj) : null;

                                    if (!eventDate) return null;

                                    // Reset hours to compare days only
                                    today.setHours(0, 0, 0, 0);
                                    eventDate.setHours(0, 0, 0, 0);

                                    const diffTime = eventDate - today;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    if (diffDays === 0) return <span style={{ background: '#25D366', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>HOY</span>;
                                    if (diffDays === 1) return <span style={{ background: '#007bff', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>MAÑANA</span>;
                                    if (diffDays > 1) return <span style={{ background: '#007bff', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>Faltan {diffDays} días</span>;
                                }
                                return null;
                            })()}
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
