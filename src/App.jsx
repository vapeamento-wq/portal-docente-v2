import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import Header from './components/Header';
import Toast from './components/Toast';
import LoginModal from './components/LoginModal';
import MaintenanceScreen from './components/MaintenanceScreen';
import NotFoundScreen from './components/NotFoundScreen';
import WelcomeScreen from './components/WelcomeScreen';
import DocenteCard, { procesarCursos } from './components/DocenteCard';
import { motion, AnimatePresence } from 'framer-motion';
import { registrarLog } from './utils/helpers';
import {
  auth,
  db,
  ref,
  onAuthStateChanged,
  onValue,
  signOut,
  trackAppEvent,
  update,
  increment,
} from './services/firebase';

const AdminPanel = lazy(() => import('./components/AdminPanel'));

const FIREBASE_BASE_URL = import.meta.env.VITE_FIREBASE_DB_BASE_URL;
// Docentes se buscan directamente por cédula (sin hash) — mismo patrón que la versión recuperada
const FIREBASE_DOCENTES_URL = `${FIREBASE_BASE_URL}/docentes/`;

const fetcher = (url) => fetch(url).then(res => res.json());

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchId, setSearchId] = useState(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [anuncioConfig, setAnuncioConfig] = useState({ activo: false, texto: '', url: '' });

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user && location.pathname === '/login') navigate('/admin', { replace: true });
    });
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  // ── Config global (mantenimiento + anuncio) ───────────────────────────────
  useEffect(() => {
    const configRef = ref(db, 'config/anuncio');
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsMaintenanceMode(Boolean(data.mantenimiento));
        let isActive = Boolean(data.texto?.trim());
        if (isActive && data.inicio && new Date() < new Date(data.inicio)) isActive = false;
        if (isActive && data.fin   && new Date() > new Date(data.fin))   isActive = false;
        setAnuncioConfig({ activo: isActive, texto: data.texto || '', url: data.url || '' });
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Búsqueda de docentes ───────────────────────────────────────────────────
  // Los docentes se buscan por cédula directa (no por hash) en Firebase nodo /docentes/<cedula>
  const { data: rawDocente, error: docenteError, isLoading: docenteLoading } = useSWR(
    searchId ? `${FIREBASE_DOCENTES_URL}${searchId}.json` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const loggedRef = React.useRef(null);
  useEffect(() => {
    if (rawDocente && searchId && loggedRef.current !== searchId) {
      loggedRef.current = searchId;
      registrarLog(searchTerm, '✅ Consulta Exitosa Docente');
      trackAppEvent('search_docente_success');
    }
  }, [rawDocente, searchId, searchTerm]);

  // Procesa los cursos del docente con la lógica de semanas
  const displayDocente = searchId && rawDocente
    ? { ...rawDocente, cursos: procesarCursos(rawDocente.cursos || []) }
    : null;

  const isSearchAttempted = searchId && rawDocente === null;
  const isNetworkError = searchId && docenteError && !rawDocente;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const id = String(searchTerm).replace(/\D/g, '').substring(0, 15);
    if (!id) return;
    setSearchId(null);
    loggedRef.current = null;
    setTimeout(() => setSearchId(id), 0);
    if (location.pathname !== '/') navigate('/');
  };

  const handleReset = () => {
    setSearchTerm('');
    setSearchId(null);
    loggedRef.current = null;
  };

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-bold text-white text-lg tracking-widest">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Iniciando...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 transition-colors duration-300">
      <Toast msg={toast.msg} show={toast.show} />

      <Routes>
        {/* ── Ruta principal ─────────────────────────────────────────────── */}
        <Route path="/" element={
          isMaintenanceMode && !currentUser ? (
            <MaintenanceScreen onAdminAccess={() => navigate('/login')} />
          ) : (
            <>
              {/* Banner de anuncio */}
              {anuncioConfig.activo && anuncioConfig.texto && (
                <div className="bg-[#003366] text-white text-center py-2 px-4 text-xs font-bold tracking-wide">
                  {anuncioConfig.url
                    ? <a href={anuncioConfig.url} target="_blank" rel="noreferrer" className="underline">{anuncioConfig.texto}</a>
                    : anuncioConfig.texto
                  }
                </div>
              )}

              <Header
                onReset={handleReset}
                docente={displayDocente}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
                loading={docenteLoading}
              />

              <main className="max-w-7xl mx-auto px-5 pt-10 pb-32">
                <AnimatePresence>
                  {!displayDocente ? (
                    (docenteLoading || isNetworkError) ? (
                      <motion.div key="loading" className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-blue-300 font-bold uppercase tracking-widest text-sm">
                          {isNetworkError ? 'Reintentando conexión...' : 'Consultando registro...'}
                        </p>
                      </motion.div>
                    ) : isSearchAttempted ? (
                      <NotFoundScreen key="notfound" searchId={searchTerm} onReset={handleReset} />
                    ) : (
                      <WelcomeScreen key="welcome" onAdminAccess={() => navigate('/login')} />
                    )
                  ) : (
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
                      <DocenteCard docente={displayDocente} onReset={handleReset} />
                      <div className="w-full flex justify-center mt-4 border-t border-slate-800 pt-8">
                        <button
                          onClick={handleReset}
                          className="text-xs font-black text-gray-400 hover:text-[#db9b32] transition-colors cursor-pointer uppercase tracking-[0.3em] border-none bg-transparent"
                        >
                          Realizar otra consulta →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </>
          )
        } />

        {/* ── Ruta de login ─────────────────────────────────────────────── */}
        <Route path="/login" element={
          <div className="min-h-screen bg-[#003366] flex items-center justify-center p-5">
            <LoginModal onSuccess={() => navigate('/admin')} onCancel={() => navigate('/')} />
          </div>
        } />

        {/* ── Ruta de admin ─────────────────────────────────────────────── */}
        <Route path="/admin" element={
          currentUser ? (
            <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-bold">Cargando panel...</div>}>
              <AdminPanel
                currentUser={currentUser}
                onBack={() => navigate('/')}
                onSelectDocente={(hash, id) => { setSearchId(id); navigate('/'); }}
                onLogout={() => signOut(auth).then(() => navigate('/'))}
              />
            </Suspense>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
