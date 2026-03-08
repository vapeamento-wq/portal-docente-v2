import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DB_BASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Singleton: reutiliza la app existente si ya fue inicializada
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Autenticación anónima silenciosa.
 * Se ejecuta al cargar la app para que todos los usuarios tengan un token
 * válido que les permita escribir en logs y analytics.
 * Si ya hay una sesión activa (admin o anónima), no hace nada.
 */
export const ensureAuth = async () => {
    if (auth.currentUser) return auth.currentUser;
    const credential = await signInAnonymously(auth);
    return credential.user;
};

/**
 * Inicia sesión del administrador con email y contraseña.
 * Esto "promueve" la sesión anónima a una sesión con identidad real.
 * Las credenciales se validan del lado de Firebase, nunca del cliente.
 */
export const loginAdmin = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();
    return { user: credential.user, idToken };
};

/**
 * Cierra la sesión del administrador y vuelve a sesión anónima.
 * Así el usuario nunca pierde capacidad de escribir logs.
 */
export const logoutAdmin = async () => {
    await signOut(auth);
    // Regresar a sesión anónima para que los logs sigan funcionando
    await signInAnonymously(auth);
};

/**
 * Obtiene el ID Token actual del usuario autenticado (anónimo o admin).
 * Retorna null si por alguna razón no hay sesión.
 */
export const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
};

/**
 * Verifica si el usuario actual es un admin autenticado (no anónimo).
 */
export const isAdmin = () => {
    const user = auth.currentUser;
    return user && !user.isAnonymous;
};

/**
 * Suscribe un callback al cambio de estado de autenticación.
 * @param {Function} callback - (user | null)
 * @returns {Function} unsubscribe
 */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
