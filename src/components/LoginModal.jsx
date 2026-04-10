import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../services/firebase';

const LoginModal = ({ onSuccess, onCancel }) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Modo: 'login' | 'forgot'
  const [mode,       setMode]      = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent,  setResetSent]  = useState(false);

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      onSuccess();
    } catch (err) {
      const code = err.code;
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(code)) {
        setError('Correo o contraseña incorrectos.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos.');
      } else if (code === 'auth/invalid-email') {
        setError('El correo ingresado no es válido.');
      } else {
        setError('Error de autenticación. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperar contraseña ────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.includes('@')) { setError('Ingresa un correo válido.'); return; }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setError(err.code === 'auth/user-not-found'
        ? 'No existe una cuenta con ese correo.'
        : 'No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const inputCls = "w-full p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 transition-all";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center transition-all">
        <img src="/logo1_450x150.png" alt="Logo Unimagdalena" className="h-16 mx-auto mb-6 object-contain" onError={e => e.target.style.display='none'} />

        {/* ══ MODO LOGIN ═══════════════════════════════════════════════════ */}
        {mode === 'login' && (
          <>
            <h3 className="text-[#003366] dark:text-blue-400 text-xl font-bold mb-1">Acceso Administrativo</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Portal Docente CREO</p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4 border border-red-100 dark:border-red-800/50">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 mb-2">
                <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required autoFocus disabled={loading} className={inputCls} aria-label="Correo" />
                <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} className={inputCls} aria-label="Contraseña" />
              </div>
              <div className="text-right mb-5">
                <button type="button" onClick={() => { setMode('forgot'); setResetEmail(email); setError(''); setResetSent(false); }} className="text-xs text-[#003366] dark:text-blue-400 hover:underline cursor-pointer font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onCancel} disabled={loading} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl border-none font-bold text-gray-600 dark:text-gray-300 cursor-pointer transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#003366] dark:bg-blue-600 hover:bg-[#002244] dark:hover:bg-blue-700 text-white font-bold rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Spinner /> : 'Entrar'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ══ MODO RECUPERAR ═══════════════════════════════════════════════ */}
        {mode === 'forgot' && (
          <>
            <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl">
              {resetSent ? '✅' : '📧'}
            </div>
            <h3 className="text-[#003366] dark:text-blue-400 text-xl font-bold mb-1">
              {resetSent ? '¡Correo enviado!' : 'Recuperar Contraseña'}
            </h3>

            {resetSent ? (
              <>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                  Le enviamos un enlace de recuperación a <strong className="text-gray-700 dark:text-gray-200">{resetEmail}</strong>.
                  <br />Revisa tu bandeja de entrada y sigue las instrucciones.
                </p>
                <button onClick={() => { setMode('login'); setError(''); }} className="w-full py-3 bg-[#003366] dark:bg-blue-600 text-white font-bold rounded-xl cursor-pointer hover:bg-[#002244] transition-colors">
                  ← Volver al inicio
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4 border border-red-100 dark:border-red-800/50">
                    {error}
                  </div>
                )}
                <form onSubmit={handleReset} className="flex flex-col gap-3">
                  <input type="email" placeholder="Tu correo de administrador" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required autoFocus disabled={loading} className={inputCls} />
                  <button type="submit" disabled={loading} className="w-full py-3 bg-[#003366] dark:bg-blue-600 text-white font-bold rounded-xl cursor-pointer hover:bg-[#002244] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Spinner /> : '📧 Enviar enlace de recuperación'}
                  </button>
                  <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-sm text-gray-500 dark:text-gray-400 hover:underline cursor-pointer">
                    ← Volver
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
