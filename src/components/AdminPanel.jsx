import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { URL_TU_EXCEL_MAESTRO, URL_FIREBASE_CONSOLE } from '../utils/helpers';

const MOCK_ANALYTICS = {
    daily: [
        { name: 'Lun', consultas: 12 },
        { name: 'Mar', consultas: 19 },
        { name: 'Mie', consultas: 15 },
        { name: 'Jue', consultas: 25 },
        { name: 'Vie', consultas: 22 },
        { name: 'Sab', consultas: 30 },
        { name: 'Dom', consultas: 10 },
    ],
    hourly: [
        { name: '08:00', hits: 5 },
        { name: '10:00', hits: 12 },
        { name: '12:00', hits: 8 },
        { name: '14:00', hits: 15 },
        { name: '16:00', hits: 20 },
        { name: '18:00', hits: 18 },
    ]
};

const AdminPanel = ({ onBack, adminSearch, setAdminSearch, adminResult, onAdminDiagnostico }) => {
    return (
        <div style={{ fontFamily: 'Segoe UI', background: '#f4f6f8', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="fade-in-up" style={{ maxWidth: '1000px', width: '100%', background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                    <div>
                        <h2 style={{ color: '#003366', margin: 0 }}>PANEL INTELEGENTE</h2>
                        <p style={{ color: '#666', margin: '5px 0 0' }}>Analítica en tiempo real</p>
                    </div>
                    <button onClick={onBack} style={{ cursor: 'pointer', padding: '10px 25px', borderRadius: '30px', border: 'none', background: '#f0f0f0', fontWeight: 'bold', color: '#333' }}>⬅ Volver</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                    {/* Chart 1: Daily Hits */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #eee', height: '300px' }}>
                        <h4 style={{ margin: '0 0 20px', color: '#003366' }}>📊 Consultas por Día</h4>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={MOCK_ANALYTICS.daily}>
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="consultas" fill="#003366" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Chart 2: Hourly Traffic */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #eee', height: '300px' }}>
                        <h4 style={{ margin: '0 0 20px', color: '#db9b32' }}>⏰ Tráfico por Hora</h4>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={MOCK_ANALYTICS.hourly}>
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Line type="monotone" dataKey="hits" stroke="#db9b32" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Existing Tools (Compact) */}
                    <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                        <h4 style={{ margin: 0 }}>Accesos Rápidos</h4>
                        <a href="https://docs.google.com/spreadsheets/d/1fHgj_yep0s7955EeaRpFiJeBLJX_-PLtjOFxWepoprQ/edit" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '15px', background: '#27ae60', color: 'white', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Excel Maestro</a>
                        <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '15px', background: '#f39c12', color: 'white', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Firebase Console</a>
                    </div>
                </div>

                {/* Diagnostic Tool */}
                <div style={{ marginTop: '30px', padding: '20px', background: '#f0f2f5', borderRadius: '20px' }}>
                    <h4 style={{ margin: '0 0 10px' }}>🕵️ Diagnóstico</h4>
                    <form onSubmit={onAdminDiagnostico} style={{ display: 'flex', gap: '10px' }}>
                        <input
                            placeholder="Cédula..."
                            value={adminSearch}
                            onChange={e => setAdminSearch(e.target.value)}
                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ccc' }}
                        />
                        <button style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Verificar</button>
                    </form>
                    {adminResult && <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>{adminResult}</div>}
                </div>

            </div>
        </div>
    );
};

export default AdminPanel;
