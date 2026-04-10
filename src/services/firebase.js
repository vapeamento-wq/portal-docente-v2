// ─── CONFIGURACIÓN CENTRALIZADA DE FIREBASE — PORTAL DOCENTE ─────────────────
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  increment,
  child,
  onValue,
} from "firebase/database";
import { getAnalytics, logEvent } from "firebase/analytics";

// ── Config ────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "dummy",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "dummy",
  databaseURL:       import.meta.env.VITE_FIREBASE_DB_BASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "dummy",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "dummy",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "dummy",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ── Inicialización ────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// ── Segunda instancia para crear/actualizar usuarios sin cerrar la sesión actual ──
let _secondaryApp  = null;
let _secondaryAuth = null;
export const getSecondaryAuth = () => {
  if (!_secondaryAuth) {
    _secondaryApp  = initializeApp(firebaseConfig, 'secondary_admin_docente');
    _secondaryAuth = getAuth(_secondaryApp);
  }
  return _secondaryAuth;
};

// Analytics (opcional – solo si measurementId existe)
let analytics = null;
try {
  if (firebaseConfig.measurementId && typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
} catch (e) {
  // Analytics no afecta la funcionalidad principal
}

// ── Helper para eventos de analytics ─────────────────────────────────────────
export const trackAppEvent = (eventName, params = {}) => {
  if (analytics) {
    try { logEvent(analytics, eventName, params); } catch (_) {}
  }
  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const eventRef = ref(db, `analytics/events_docente/${eventName}/${dateStr}`);
    set(eventRef, increment(1)).catch(() => {});
  } catch (e) {}
};

// ── Exports ───────────────────────────────────────────────────────────────────
export {
  app,
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  ref,
  onValue,
  get,
  set,
  push,
  update,
  increment,
  child,
};
