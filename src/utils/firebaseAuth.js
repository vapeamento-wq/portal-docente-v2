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

// Inicialización defensiva: si falta la API key, no crashear la app entera
let auth = null;
try {
    if (firebaseConfig.apiKey) {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
    } else {
        console.warn('⚠️ VITE_FIREBASE_API_KEY no configurada. Auth deshabilitado.');
    }
} catch (e) {
    console.error('Error inicializando Firebase Auth:', e);
}

export { auth };

/**
 * Autenticación anónima silenciosa.
 * Se ejecuta al cargar la app para que todos los usuarios tengan un token
 * válido que les permita escribir en logs y analytics.
 * Si ya hay una sesión activa (admin o anónima), no hace nada.
 * Si Auth no está disponible, no hace nada (graceful degradation).
 */
export const ensureAuth = async () => {
    if (!auth) return null;
    if (auth.currentUser) return auth.currentUser;
    try {
        const credential = await signInAnonymously(auth);
        return credential.user;
    } catch (e) {
        console.warn('Anonymous auth failed (app sigue funcionando):', e.message);
        return null;
    }
};

/**
 * Inicia sesión del administrador con email y contraseña.
 */
export const loginAdmin = async (email, password) => {
    if (!auth) throw new Error('Firebase Auth no está configurado.');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();
    return { user: credential.user, idToken };
};

/**
 * Cierra la sesión del administrador y vuelve a sesión anónima.
 */
export const logoutAdmin = async () => {
    if (!auth) return;
    await signOut(auth);
    try {
        await signInAnonymously(auth);
    } catch (e) {
        console.warn('Re-anonymous auth failed:', e.message);
    }
};

/**
 * Obtiene el ID Token actual del usuario autenticado (anónimo o admin).
 * Retorna null si no hay sesión o Auth no está disponible.
 */
export const getAuthToken = async () => {
    if (!auth || !auth.currentUser) return null;
    try {
        return await auth.currentUser.getIdToken();
    } catch (e) {
        return null;
    }
};

/**
 * Determina el rol del usuario actual.
 * - 'admin': email coincide con el admin configurado (acceso total)
 * - 'monitor': cualquier otro usuario autenticado con email (solo lectura)
 * - null: usuario anónimo o sin sesión
 */
export const getUserRole = () => {
    if (!auth || !auth.currentUser) return null;
    if (auth.currentUser.isAnonymous) return null;

    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
    const userEmail = (auth.currentUser.email || '').toLowerCase().trim();

    if (adminEmail && userEmail === adminEmail) return 'admin';
    return 'monitor';
};

/**
 * Verifica si el usuario actual es un admin autenticado (no anónimo).
 * Compatible con código existente.
 */
export const isAdmin = () => {
    if (!auth || !auth.currentUser) return false;
    return !auth.currentUser.isAnonymous;
};

/**
 * Verifica si el usuario actual tiene acceso admin completo.
 */
export const isFullAdmin = () => getUserRole() === 'admin';

/**
 * Suscribe un callback al cambio de estado de autenticación.
 */
export const onAuthChange = (callback) => {
    if (!auth) {
        // Si Auth no está disponible, ejecutar callback con null y retornar noop
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
};
