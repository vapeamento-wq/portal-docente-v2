import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HeroCard from './components/HeroCard';
import Timeline from './components/Timeline';
import Toast from './components/Toast';
import LoginModal from './components/LoginModal';
import ProgramSelectionModal from './components/ProgramSelectionModal';
import AdminPanel from './components/AdminPanel';
import MaintenanceScreen from './components/MaintenanceScreen';
import NotFoundScreen from './components/NotFoundScreen';
import WelcomeScreen from './components/WelcomeScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { registrarLog, procesarCursos, formatoFechaHora } from './utils/helpers';
import { ensureAuth, loginAdmin, logoutAdmin, onAuthChange, isAdmin, getUserRole } from './utils/firebaseAuth';
import { trackAppEvent } from './utils/analytics';

const FIREBASE_DB_URL = `${import.meta.env.VITE_FIREBASE_DB_BASE_URL}/docentes/`;
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

// Fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

const App = () => {
  const [view, setView] = useState('user');

  // Estado de autenticación del administrador (manejado por Firebase Auth)
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Estados Usuario
  const [searchTerm, setSearchTerm] = useState('');
  const [searchId, setSearchId] = useState(null); // ID real para SWR
  const [docente, setDocente] = useState(null);

  // Estados para Selección de Programa
  const [programasDisponibles, setProgramasDisponibles] = useState([]);
  const [selectedProgramaUI, setSelectedProgramaUI] = useState(null);
  const [esperandoPrograma, setEsperandoPrograma] = useState(false);

  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);
  const [anuncio, setAnuncio] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const [fechaActual, setFechaActual] = useState(new Date());
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Auth Anónima silenciosa: al cargar la app, todos los usuarios obtienen un token
  // invisible para poder escribir logs y analytics en Firebase.
  useEffect(() => {
    ensureAuth().catch(err => console.warn('Anonymous auth failed:', err));
  }, []);

  // Observer de Firebase Auth — persiste la sesión entre recargas
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setIsAdminAuth(user ? isAdmin() : false);
      // Si un admin inicia sesión y estaba en la pantalla de login, ir al panel
      if (user && !user.isAnonymous && view === 'login') setView('admin');
    });
    return () => unsubscribe();
  }, [view]);

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

      // Lógica de Múltiples Programas
      const programas = Array.from(new Set(cursosProcesados.map(c => c.programa || 'Sin Programa')));

      if (programas.length > 1) {
        // Hay varios programas, detener el flujo y preguntar
        setProgramasDisponibles(programas);
        setEsperandoPrograma(true);
        // Guardamos todo el docente pero no seleccionamos programa todavía
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDocente({ ...rawData, cursos: cursosProcesados });
      } else {
        // Solo 1 programa, avanza directo
        const programaUnico = programas[0] || null;
        setProgramasDisponibles(programas);
        setSelectedProgramaUI(programaUnico);
        setEsperandoPrograma(false);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDocente({ ...rawData, cursos: cursosProcesados });
        setSelectedCursoIdx(0);
      }

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
    // Sanitización rigurosa: solo números y máximo 15 caracteres
    const rawInput = String(searchTerm).trim();
    const idBusqueda = rawInput.replace(/\D/g, '').substring(0, 15);

    if (!idBusqueda) {
      showToast('❌ Documento inválido');
      return;
    }

    if (rawInput !== idBusqueda) {
      setSearchTerm(idBusqueda); // Limpia visualmente el input de letras
    }

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

  // --- AUTENTICACIÓN ADMINISTRADOR (Firebase Auth) ---
  const handleLogin = async (email, password) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      await loginAdmin(email, password);
      setView('admin');
    } catch (err) {
      console.error('Login error:', err.code, err.message);
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Correo o contraseña incorrectos.'
        : err.code === 'auth/too-many-requests'
          ? 'Demasiados intentos. Intenta más tarde.'
          : err.code === 'auth/unauthorized-domain'
            ? 'Dominio no autorizado. Agrega este dominio en Firebase Console → Auth → Configuración → Dominios autorizados.'
            : `Error: ${err.code || err.message}`;
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('portal_docente_id'); // Borrar ID
    setDocente(null);
    setSearchTerm('');
    setSearchId(null);
    setSelectedCursoIdx(0);
    setSearchAttempted(false);
    setSelectedProgramaUI(null);
    setEsperandoPrograma(false);
    setProgramasDisponibles([]);

    // Si el usuario es un administrador autenticado, devolverlo a su panel
    if (isAdminAuth) {
      setView('admin');
    }
  };

  const handleProgramSelect = (prog) => {
    setSelectedProgramaUI(prog);
    setEsperandoPrograma(false);
    setSelectedCursoIdx(0);
  };

  const handleProgramCancel = () => {
    handleReset();
  };

  // Filtrar los cursos basados en el programa seleccionado (si existe)
  const cursosFiltrados = docente ? (selectedProgramaUI ? docente.cursos.filter(c => (c.programa || 'Sin Programa') === selectedProgramaUI) : docente.cursos) : [];

  // Utilizar los cursos filtrados para HeroCard y Timeline
  const cursoActivo = cursosFiltrados.length > 0 ? cursosFiltrados[selectedCursoIdx] : null;

  // --- VISTA ADMIN (CON DASHBOARD) ---
  if (view === 'admin') {
    return (
      <AdminPanel
        onBack={async () => { await logoutAdmin(); setView('user'); }}
        onSelectDocente={handleAdminSelectDocente}
        userRole={getUserRole()}
      />
    );
  }

  // --- MANTENIMIENTO DINÁMICO ---
  const isMaintenance = isMaintenanceMode; // Lee el estado de Firebase

  // Si está en mantenimiento, no es login, y no es un Admin autenticado, bloquea.
  if (isMaintenance && view !== 'login' && !isAdminAuth) {
    return <MaintenanceScreen onAdminAccess={() => setView('login')} />;
  }

  // --- VISTA USUARIO ---
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-900 text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-[#003366] dark:selection:bg-blue-500 selection:text-white pb-10 transition-colors duration-300">
      <Toast msg={toast.msg} show={toast.show} />

      {/* LOGIN ADMIN */}
      {view === 'login' && (
        <LoginModal
          onSubmit={handleLogin}
          onCancel={() => setView('user')}
          loading={loginLoading}
          error={loginError}
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

      {/* MODAL DE SELECCIÓN DE PROGRAMA */}
      {esperandoPrograma && programasDisponibles.length > 1 && (
        <ProgramSelectionModal
          programas={programasDisponibles}
          onSelect={handleProgramSelect}
          onCancel={handleProgramCancel}
        />
      )}

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
              <NotFoundScreen
                searchId={searchId}
                onReset={handleReset}
                whatsappNumber={WHATSAPP_NUMBER}
              />
            ) : (
              <WelcomeScreen
                fechaEspanol={formatoFechaHora(fechaActual).fecha}
                onAdminAccess={() => setView('login')}
              />
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
                docente={{ ...docente, cursos: cursosFiltrados }}
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
      <SpeedInsights />
    </div>
  );
};

export default App;
