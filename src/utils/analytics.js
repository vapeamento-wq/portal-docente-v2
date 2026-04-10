import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DB_BASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Singleton defensivo: si falta la API key, analytics simplemente no se activa
let analytics = null;
try {
    if (firebaseConfig.apiKey && typeof window !== 'undefined') {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        if (firebaseConfig.measurementId) {
            analytics = getAnalytics(app);
        }
    }
} catch (e) {
    console.warn('Analytics no pudo iniciar:', e);
}

/**
 * Registra un evento en Google Analytics (Firebase Analytics).
 * No falla si analytics no está disponible.
 */
export const trackAppEvent = (eventName, params = {}) => {
    if (analytics) {
        try {
            logEvent(analytics, eventName, params);
        } catch (e) {
            console.warn('Analytics event failed', e);
        }
    }
};
