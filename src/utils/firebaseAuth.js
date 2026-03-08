import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

// Reutilizar la app si ya fue inicializada (para evitar conflicto con App.jsx)
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
 * Inicia sesión del administrador con email y contraseña.
 * Las credenciales se validan del lado de Firebase, nunca del cliente.
 * @returns {Promise<{user, idToken}>}
 */
export const loginAdmin = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();
    return { user: credential.user, idToken };
};

/**
 * Cierra la sesión del administrador.
 */
export const logoutAdmin = () => signOut(auth);

/**
 * Obtiene el ID Token actual del usuario autenticado (para llamadas a Firebase RTDB).
 * Retorna null si no hay sesión activa.
 */
export const getAdminToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
};

/**
 * Suscribe un callback al cambio de estado de autenticación.
 * @param {Function} callback - (user | null)
 * @returns {Function} unsubscribe
 */
export const onAdminAuthChange = (callback) => onAuthStateChanged(auth, callback);
