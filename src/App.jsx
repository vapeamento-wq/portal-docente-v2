import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HeroCard from './components/HeroCard';
import Timeline from './components/Timeline';
import Toast from './components/Toast';
import LoginModal from './components/LoginModal';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { registrarLog, procesarCursos, formatoFechaHora, URL_SCRIPT_LOGS } from './utils/helpers';

// --- ⚡ CONFIGURACIÓN MAESTRA (V21.0 - CON LOGS DE ERROR) ---
const FIREBASE_DB_URL = `${import.meta.env.VITE_FIREBASE_DB_BASE_URL}/docentes/`;
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;

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



  // --- 💾 PERSISTENCIA (RECORDARME) ---
  useEffect(() => {
    const storedId = localStorage.getItem('portal_docente_id');
    if (storedId) {
      setSearchTerm(storedId);
      setSearchId(storedId);
    }
  }, []);

  // --- BÚSQUEDA PRINCIPAL ---
  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (!idBusqueda) { showToast('❌ Documento inválido'); return; }

    localStorage.setItem('portal_docente_id', idBusqueda); // Guardar ID
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
    localStorage.removeItem('portal_docente_id'); // Borrar ID
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
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-900 text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-[#003366] dark:selection:bg-blue-500 selection:text-white pb-10 transition-colors duration-300">
      <Toast msg={toast.msg} show={toast.show} />

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

      <main className="max-w-7xl mx-auto mt-10 px-5 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-10 pb-24">
        <AnimatePresence mode="wait">
          {!docente ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="col-span-1 md:col-span-2 text-center py-24 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg rounded-[20px] transition-colors duration-300"
            >
              <div className="text-8xl mb-5">👨‍🏫</div>
              <h1 className="text-[#003366] dark:text-blue-400 mb-4 text-4xl font-bold">Portal Docente</h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">Gestiona tu programación académica de forma privada y segura.</p>
              <div className="mt-10 text-xl text-gray-800 dark:text-gray-200 font-bold capitalize">{formatoFechaHora(fechaActual).fecha}</div>
              <div className="mt-20 cursor-pointer opacity-30 text-xs hover:opacity-100 transition-opacity dark:text-gray-400" onClick={() => setView('login')}>🔒 Acceso Administrativo</div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-10"
            >
              <Sidebar
                docente={docente}
                selectedCursoIdx={selectedCursoIdx}
                setSelectedCursoIdx={setSelectedCursoIdx}
              />

              <section className="flex flex-col gap-8">
                <HeroCard cursoActivo={cursoActivo} />
                <Timeline cursoActivo={cursoActivo} docenteId={docente.idReal} />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="fixed bottom-8 right-8 bg-[#25D366] text-white px-6 py-4 rounded-full font-bold shadow-[0_10px_30px_rgba(37,211,102,0.4)] z-50 hover:scale-105 transition-transform flex items-center gap-2 no-underline">
        💬 Ayuda
      </a>
    </div>
  );
};

export default App;

