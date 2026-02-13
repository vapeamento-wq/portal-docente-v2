import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HeroCard from './components/HeroCard';
import Timeline from './components/Timeline';
import Toast from './components/Toast';
import LoginModal from './components/LoginModal';
import AdminPanel from './components/AdminPanel';
import { registrarLog, procesarCursos, formatoFechaHora, URL_SCRIPT_LOGS } from './utils/helpers';

// --- ⚡ CONFIGURACIÓN MAESTRA (V21.0 - CON LOGS DE ERROR) ---
const FIREBASE_DB_URL = "https://portal-creo-db-default-rtdb.firebaseio.com/docentes/";
const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo";

// Fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

const App = () => {
  const [view, setView] = useState('user');
  const [passInput, setPassInput] = useState('');

  // Estados Usuario
  const [searchTerm, setSearchTerm] = useState('');
  const [searchId, setSearchId] = useState(null); // ID real para SWR
  const [docente, setDocente] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  // Estados Admin (Diagnóstico)
  const [adminSearch, setAdminSearch] = useState('');
  const [adminResult, setAdminResult] = useState(null);

  const [fechaActual, setFechaActual] = useState(new Date());
  const [toast, setToast] = useState({ show: false, msg: '' });

  // SWR Hook para data fetching
  const { data: rawData, error, isLoading } = useSWR(
    searchId ? `${FIREBASE_DB_URL}${searchId}.json` : null,
    fetcher,
    {
      revalidateOnFocus: false, // No recargar al cambiar de tab
      dedupingInterval: 60000, // Cache por 1 minuto
      shouldRetryOnError: false
    }
  );

  // Efecto para procesar datos cuando llegan de SWR
  const showToast = (mensaje) => {
    setToast({ show: true, msg: mensaje });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  useEffect(() => {
    if (rawData) {
      const cursosProcesados = procesarCursos(rawData.cursos);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocente({ ...rawData, cursos: cursosProcesados });
      setSelectedCursoIdx(0);
      registrarLog(searchId, '✅ Consulta Exitosa (Cache/Red)');
    } else if (error) {
      showToast('⚠️ Error de Red');
      registrarLog(searchId, '⚠️ Error Crítico de Red');
    } else if (rawData === null && searchId) {
      // SWR devolvió null (no encontrado en Firebase devuelve null body?)
      // Firebase RTDB devuelve null si clave no existe
      setDocente(null);
      showToast('❌ No encontrado');
      registrarLog(searchId, '❌ ID No Encontrado');
    }
  }, [rawData, error, searchId]);

  useEffect(() => {
    const timer = setInterval(() => setFechaActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);



  // --- BÚSQUEDA PRINCIPAL ---
  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (!idBusqueda) { showToast('❌ Documento inválido'); return; }

    setDocente(null);
    setSearchId(idBusqueda); // Trigger SWR
  };

  const handleAdminDiagnostico = async (e) => {
    e.preventDefault();
    if (!adminSearch) return;
    setAdminResult('🔍 Verificando en Firebase...');
    try {
      const res = await fetch(`${FIREBASE_DB_URL}${adminSearch}.json`);
      const data = await res.json();
      if (data) {
        setAdminResult(`✅ ENCONTRADO: ${data.nombre} | ${data.cursos?.length || 0} Cursos`);
      } else {
        setAdminResult('❌ NO ENCONTRADO: El ID no existe en la BD.');
      }
    } catch {
      setAdminResult('⚠️ ERROR DE RED: Revisa tu conexión.');
    }
  };

  const handleReset = () => {
    setDocente(null);
    setSearchTerm('');
    setSearchId(null);
    setSelectedCursoIdx(0);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) setView('admin');
    else alert("Contraseña incorrecta");
  };

  const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

  // --- VISTA ADMIN (CON DASHBOARD) ---
  if (view === 'admin') {
    return (
      <AdminPanel
        onBack={() => setView('user')}
        adminSearch={adminSearch}
        setAdminSearch={setAdminSearch}
        adminResult={adminResult}
        onAdminDiagnostico={handleAdminDiagnostico}
      />
    );
  }

  // --- VISTA USUARIO ---
  return (
    <div className="portal-container">
      <Toast msg={toast.msg} show={toast.show} />
      <style>{`
        :root { --primary: #003366; --secondary: #db9b32; --bg: #F0F2F5; --text: #1A1A1A; }
        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
        
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-radius: 20px; }
        
        .header { background: var(--primary); padding: 25px 0; position: relative; overflow: hidden; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; }
        .brand h1 { margin: 0; color: var(--secondary); font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; } 
        .brand h2 { margin: 5px 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.8); font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }

        .search-container { background: white; padding: 5px; border-radius: 50px; display: flex; box-shadow: 0 5px 20px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .search-container input { padding: 12px 20px; border-radius: 50px; border: none; outline: none; font-size: 1rem; width: 200px; background: transparent; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 10px 30px; font-weight: 800; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; }

        .main-content { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 40px; }
        .sidebar { padding: 30px; height: fit-content; animation: fadeInUp 0.5s ease-out; }
        .profile-header { text-align: center; margin-bottom: 30px; }
        .avatar { width: 90px; height: 90px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--primary); font-weight: bold; margin: 0 auto 15px; box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); border: 4px solid white; }
        
        .course-btn { width: 100%; padding: 15px 20px; margin-bottom: 12px; border: none; background: transparent; text-align: left; border-radius: 15px; position: relative; transition: all 0.2s; color: #666; cursor:pointer; border: 1px solid transparent; }
        .course-btn.active { background: white; border-color: var(--secondary); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .course-btn.active .bloque-badge { background: var(--primary); color: white; }
        .bloque-badge { display: inline-block; font-size: 0.7rem; background: #eee; padding: 2px 8px; border-radius: 10px; margin-top: 5px; font-weight: bold; color: #555; }

        .hero-card { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 40px; border-radius: 30px; position: relative; overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0, 51, 102, 0.3); }
        .hero-info-grid { display: flex; gap: 20px; margin-top: 25px; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 15px 20px; border-radius: 15px; backdrop-filter: blur(5px); }
        .hero-info-item { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.95rem; }
        
        .timeline-container { padding: 40px; background: white; border-radius: 30px; }
        .timeline-item { display: flex; gap: 25px; margin-bottom: 30px; position: relative; }
        .timeline-line { position: absolute; left: 24px; top: 50px; bottom: -30px; width: 3px; background: #f0f0f0; }
        .date-circle { width: 50px; height: 50px; background: #fff; border: 3px solid #eee; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; color: #aaa; z-index: 1; }
        
        .timeline-content { flex: 1; background: #fcfcfc; padding: 25px; border-radius: 20px; border: 1px solid #f0f0f0; transition: all 0.3s; }
        .timeline-content:hover { background: white; border-color: var(--secondary); box-shadow: 0 15px 30px rgba(0,0,0,0.06); }
        
        /* Timeline States */
        /* Timeline States */
        /* PAST - Grey */
        .timeline-item.past .timeline-content { opacity: 0.6; background: #f9f9f9; }
        .timeline-item.past .date-circle { opacity: 0.6; background: #f5f5f5; border-color: #ddd; color: #ccc; }
        .timeline-item.past .timeline-line { background: #e0e0e0; }
        
        /* PRESENT - Green */
        .timeline-item.present .timeline-content { border: 2px solid #25D366; background: white; box-shadow: 0 10px 25px rgba(37, 211, 102, 0.15); transform: scale(1.02); }
        .timeline-item.present .date-circle { border-color: #25D366; color: white; background: #25D366; box-shadow: 0 5px 15px rgba(37, 211, 102, 0.2); }
        .timeline-item.present .timeline-line { background: #25D366; }
        
        /* FUTURE - Blue */
        .timeline-item.future .date-circle { border-color: var(--primary); color: white; background: var(--primary); }
        .timeline-item.future .timeline-line { background: var(--primary); }
        
        .zoom-mini-btn { display: inline-flex; align-items: center; gap: 8px; background: #2D8CFF; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.9rem; font-weight: bold; margin-top: 15px; }
        .copy-icon { cursor: pointer; opacity: 0.6; font-size: 1.1rem; }

        .offline-badge { display: inline-block; background: #e3f2fd; color: #1565c0; padding: 8px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; margin-top: 10px; border: 1px solid rgba(21, 101, 192, 0.1); }
        .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 30px rgba(37, 211, 102, 0.4); z-index: 100; }

        .toast-notification { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px); background: rgba(0,0,0,0.85); color: white; padding: 12px 24px; border-radius: 50px; font-weight: bold; opacity: 0; transition: all 0.3s; }
        .toast-notification.show { transform: translateX(-50%) translateY(0); opacity: 1; }

        @media (max-width: 900px) { 
          .main-content { display: flex; flex-direction: column; } 
          .sidebar { order: -1; display: flex; overflow-x: auto; padding: 15px; gap: 15px; }
          .course-btn { min-width: 240px; margin-bottom: 0; }
        }
      `}</style>

      {/* LOGIN ADMIN */}
      {view === 'login' && (
        <LoginModal
          onSubmit={handleLogin}
          passInput={passInput}
          setPassInput={setPassInput}
          onCancel={() => setView('user')}
        />
      )}

      <Header
        onReset={handleReset}
        docente={docente}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
        loading={isLoading}
      />

      <main className="main-content">
        {!docente ? (
          <div className="glass-panel fade-in-up" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px' }}>👨🏫</div>
            <h1 style={{ color: 'var(--primary)', marginBottom: '15px', fontSize: '2.5rem' }}>Portal Docente</h1>
            <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>Gestiona tu programación académica de forma privada y segura.</p>
            <div style={{ marginTop: '40px', fontSize: '1.2rem', color: '#333', fontWeight: 'bold' }}>{formatoFechaHora(fechaActual).fecha}</div>
            <div style={{ marginTop: '80px', cursor: 'pointer', opacity: 0.3, fontSize: '0.8rem' }} onClick={() => setView('login')}>🔒 Acceso Administrativo</div>
          </div>
        ) : (
          <>
            <Sidebar
              docente={docente}
              selectedCursoIdx={selectedCursoIdx}
              setSelectedCursoIdx={setSelectedCursoIdx}
            />

            <section className="dashboard-column">
              <HeroCard cursoActivo={cursoActivo} />
              <Timeline cursoActivo={cursoActivo} docenteId={docente.idReal} />
            </section>
          </>
        )}
      </main>

      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn">💬 Ayuda</a>
    </div>
  );
};

export default App;
