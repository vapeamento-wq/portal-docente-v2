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
import { Analytics } from '@vercel/analytics/react';
import { registrarLog, procesarCursos, formatoFechaHora, URL_SCRIPT_LOGS } from './utils/helpers';
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

// --- ⚡ CONFIGURACIÓN MAESTRA (V21.0 - CON LOGS DE ERROR Y ANALYTICS) ---

// Configuración opcional de Firebase para Analytics (Si no envías VITE_FIREBASE_MEASUREMENT_ID, no hace nada y no rompe la app)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy",
  databaseURL: import.meta.env.VITE_FIREBASE_DB_BASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let analytics = null;
try {
  // Solo iniciar si measurementId existe.
  if (firebaseConfig.measurementId && typeof window !== "undefined") {
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    console.log("📊 Google Analytics Inicializado");
  }
} catch (e) {
  console.warn("⚠️ Analytics no pudo iniciar correctamente:", e);
}

// Custom wrapper to easily track events anywhere
export const trackAppEvent = (eventName, params = {}) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, params);
    } catch (e) {
      console.warn("Analytics event failed", e);
    }
  }
};

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
  const [anuncio, setAnuncio] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

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

  // ... (keeping useEffects and handlers intact below)
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
      setSearchAttempted(false); // Reset on success
      registrarLog(searchId, '✅ Consulta Exitosa (Cache/Red)');
      trackAppEvent("search_success");
    } else if (error) {
      showToast('⚠️ Error de Red');
      setSearchAttempted(true); // Show error view
      registrarLog(searchId, '⚠️ Error Crítico de Red');
      trackAppEvent("search_error", { error_type: "network" });
    } else if (rawData === null && searchId) {
      // SWR devolvió null (no encontrado en Firebase devuelve null body?)
      // Firebase RTDB devuelve null si clave no existe
      setDocente(null);
      setSearchAttempted(true); // Show not found view
      showToast('❌ No encontrado');
      registrarLog(searchId, '❌ ID No Encontrado');
      trackAppEvent("search_error", { error_type: "not_found" });
    }
  }, [rawData, error, searchId]);

  useEffect(() => {
    const timer = setInterval(() => setFechaActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Fetch Global Announcement & Maintenance Mode periodically
  useEffect(() => {
    const fetchAnuncio = async () => {
      try {
        const dbBaseUrl = import.meta.env.VITE_FIREBASE_DB_BASE_URL;
        const res = await fetch(`${dbBaseUrl}/config/anuncio.json`);
        const data = await res.json();

        // Extraer bandera de mantenimiento dinámico
        if (data && typeof data.mantenimiento !== 'undefined') {
          setIsMaintenanceMode(Boolean(data.mantenimiento));
        }

        if (data && data.texto && data.texto.trim() !== '') {
          const now = new Date();
          let esValido = true;

          if (data.inicio) {
            const fechaInicio = new Date(data.inicio);
            if (now < fechaInicio) esValido = false;
          }

          if (data.fin) {
            const fechaFin = new Date(data.fin);
            if (now > fechaFin) esValido = false;
          }

          if (esValido) {
            setAnuncio(data.texto);
          } else {
            setAnuncio(null);
          }
        } else {
          setAnuncio(null);
        }
      } catch (err) {
        console.error("Error fetching admin config:", err);
      }
    };

    fetchAnuncio();

    // Polling cada 30 segundos para detectar si se activó el mantenimiento
    const pollTimer = setInterval(fetchAnuncio, 30000);
    return () => clearInterval(pollTimer);

  }, [view]); // Refetch when view changes

  // --- 💾 PERSISTENCIA (RECORDARME) ---
  useEffect(() => {
    const storedId = localStorage.getItem('portal_docente_id');
    if (storedId) {
      setSearchTerm(storedId);
      setSearchId(storedId);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (!idBusqueda) { showToast('❌ Documento inválido'); return; }

    localStorage.setItem('portal_docente_id', idBusqueda); // Guardar ID
    setDocente(null);
    setSearchAttempted(false); // Reset while loading
    setSearchId(idBusqueda); // Trigger SWR
  };

  const handleAdminSelectDocente = (idDocente) => {
    localStorage.setItem('portal_docente_id', idDocente);
    setSearchTerm(idDocente);
    setDocente(null);
    setSearchAttempted(false);
    setSearchId(idDocente);
    setView('user');
  };

  const [isAdminAuth, setIsAdminAuth] = useState(localStorage.getItem('isAdminAuth') === 'true');

  const handleReset = () => {
    localStorage.removeItem('portal_docente_id'); // Borrar ID
    setDocente(null);
    setSearchTerm('');
    setSearchId(null);
    setSelectedCursoIdx(0);
    setSearchAttempted(false);

    // Si el usuario es un administrador autenticado, devolverlo a su panel
    if (isAdminAuth) {
      setView('admin');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) {
      setIsAdminAuth(true);
      localStorage.setItem('isAdminAuth', 'true');
      setView('admin');
    }
    else alert("Contraseña incorrecta");
  };

  const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

  // --- VISTA ADMIN (CON DASHBOARD) ---
  if (view === 'admin') {
    return (
      <AdminPanel
        onBack={() => setView('user')}
        onSelectDocente={handleAdminSelectDocente}
      />
    );
  }

  // --- MANTENIMIENTO DINÁMICO ---
  const isMaintenance = isMaintenanceMode; // Lee el estado de Firebase

  // Si está en mantenimiento, no es login, y no es un Admin autenticado, bloquea.
  if (isMaintenance && view !== 'login' && !isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-900 flex flex-col justify-center items-center text-center px-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl max-w-lg border border-gray-100 dark:border-slate-700">
          <div className="text-6xl mb-6 animate-bounce">🛠️</div>
          <h1 className="text-3xl font-bold text-[#003366] dark:text-blue-400 mb-4">Portal en Mantenimiento</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
            Estamos realizando actualizaciones urgentes en nuestra base de datos para mejorar tu experiencia.
            El servicio se restablecerá a la brevedad.
          </p>
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-lg font-bold text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            Trabajando en el sistema
          </div>
        </div>
        <div
          className="mt-8 opacity-10 hover:opacity-100 cursor-pointer transition-opacity"
          onClick={() => setView('login')}
        >
          🔒 Acceso Admin
        </div>
      </div>
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

      {anuncio && view !== 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mt-6 px-5"
        >
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
            <span className="text-xl">📢</span>
            <div className="flex-1 whitespace-pre-wrap">{anuncio}</div>
            <button onClick={() => setAnuncio(null)} className="text-blue-400 hover:text-blue-600 font-bold px-2 py-1 cursor-pointer">✕</button>
          </div>
        </motion.div>
      )}

      <main className="max-w-7xl mx-auto mt-10 px-5 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-10 pb-24">
        <AnimatePresence mode="wait">
          {!docente ? (
            searchAttempted ? (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="col-span-1 md:col-span-2 text-center py-16 px-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-red-100 dark:border-red-900/30 shadow-lg rounded-[20px] transition-colors duration-300"
              >
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl border-[8px] border-white dark:border-slate-800 shadow-sm">
                  🤔
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] dark:text-white mb-4">
                  Docente no encontrado
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-base md:text-lg">
                  No pudimos encontrar una programación académica asociada al número de documento <strong>{searchId}</strong> en nuestra base de datos.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors w-full sm:w-auto border-none cursor-pointer"
                  >
                    Intentar de nuevo
                  </button>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-[#25D366] hover:bg-[#20bd59] text-white font-bold rounded-xl transition-colors w-full sm:w-auto border-none flex items-center justify-center gap-2 no-underline"
                  >
                    <span>💬</span> Reportar por WhatsApp
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="col-span-1 md:col-span-2 text-center py-24 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg rounded-[20px] transition-colors duration-300 relative overflow-hidden"
              >
                <div className="text-8xl mb-5">👨‍🏫</div>
                <h1 className="text-[#003366] dark:text-blue-400 mb-4 text-4xl font-bold">Portal Docente</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">Gestiona tu programación académica de forma privada y segura.</p>

                <div className="mt-10 text-xl text-gray-800 dark:text-gray-200 font-bold capitalize">{formatoFechaHora(fechaActual).fecha}</div>
                <div className="absolute bottom-5 right-5 cursor-pointer opacity-20 text-xs hover:opacity-100 transition-opacity dark:text-gray-400" onClick={() => setView('login')}>🔒 Acceso Administrativo</div>
              </motion.div>
            )
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackAppEvent("click_whatsapp_support", { location: "floating_button" })}
          className="bg-[#25D366] text-white w-14 h-14 rounded-full font-bold shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform flex items-center justify-center text-2xl no-underline"
          title="Soporte por WhatsApp"
        >
          💬
        </a>
      </div>
      <Analytics />
    </div>
  );
};

export default App;
