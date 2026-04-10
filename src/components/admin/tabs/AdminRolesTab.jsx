import React, { useState } from 'react';
import { db, ref, set, auth, getSecondaryAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, sendPasswordResetEmail } from '../../../services/firebase';

// ─── Configuración de Roles ───────────────────────────────────────────────────
const ROLES_CONFIG = {
    1: {
        label: 'Super Admin',
        emoji: '🔴',
        colorBadge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        colorCard:  'border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-900/10',
        permisos: ['⚙️ Datos (Excel + Anuncios)', '👥 Directorio (CRUD)', '📊 Analytics', '🎧 CRM', '🔐 Gestión de Roles'],
    },
    2: {
        label: 'Admin',
        emoji: '🟡',
        colorBadge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        colorCard:  'border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10',
        permisos: ['👥 Directorio (CRUD)', '📊 Analytics', '🎧 CRM'],
    },
    3: {
        label: 'Soporte',
        emoji: '🟢',
        colorBadge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
        colorCard:  'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10',
        permisos: ['🎧 CRM (Tickets de soporte)'],
    },
};

const RoleBadge = ({ rol }) => {
    const cfg = ROLES_CONFIG[Number(rol)] || ROLES_CONFIG[3];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.colorBadge}`}>
            {cfg.emoji} {cfg.label}
        </span>
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseAdminVal = (val) => ({
    rol:      typeof val === 'object' && val !== null ? (val.rol      ?? 1)  : (Number(val) || 1),
    password: typeof val === 'object' && val !== null ? (val.password ?? '') : '',
});

const inputCls = "w-full p-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 outline-none transition-all";

// ─── Componente de contraseña con toggle ─────────────────────────────────────
const PasswordCell = ({ password }) => {
    const [show, setShow] = useState(false);
    if (!password) return <span className="text-gray-400 text-xs italic">Sin contraseña registrada</span>;
    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                {show ? password : '••••••••'}
            </span>
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="text-gray-400 hover:text-[#003366] dark:hover:text-blue-400 transition-colors cursor-pointer text-xs"
                title={show ? 'Ocultar' : 'Mostrar'}
            >
                {show ? '🙈' : '👁️'}
            </button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
const AdminRolesTab = ({ adminRoles, currentUser, refetchData }) => {
    const [newEmail,    setNewEmail]    = useState('');
    const [newRol,      setNewRol]      = useState(2);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [savingHash,  setSavingHash]  = useState('');
    // Modo creación: 'manual' (Super Admin ve la clave) | 'invite' (admin recibe email)
    const [creationMode, setCreationMode] = useState('invite');

    // Modal cambiar contraseña
    const [changingHash,    setChangingHash]    = useState(null);
    const [changeEmail,     setChangeEmail]     = useState('');
    const [changePassword,  setChangePassword]  = useState('');
    const [showChangePass,  setShowChangePass]  = useState(false);

    const currentHash = (currentUser?.email || '').replace(/\./g, '_');

    // Construir lista normalizada
    const adminList = Object.entries(adminRoles || {}).map(([hash, val]) => {
        const parsed = parseAdminVal(val);
        return { hash, email: hash.replace(/_/g, '.'), ...parsed };
    }).sort((a, b) => a.rol - b.rol);

    // ── Agregar nuevo admin ────────────────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();
        const email = newEmail.trim().toLowerCase();
        if (!email.includes('@')) { alert('Correo inválido.'); return; }
        if (creationMode === 'manual' && (!newPassword || newPassword.length < 6)) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setSaving(true);
        const hash = email.replace(/\./g, '_');
        const tempPassword = creationMode === 'invite'
            ? `CREO_${Date.now()}_${Math.random().toString(36).slice(2)}` // Temporal, se reemplaza con reset
            : newPassword;

        try {
            // 1. Crear cuenta en Firebase Auth via la app secundaria
            const secondaryAuth = getSecondaryAuth();
            let accountCreated = false;
            try {
                await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
                accountCreated = true;
            } catch (authErr) {
                if (authErr.code === 'auth/email-already-in-use') {
                    accountCreated = false; // La cuenta ya existía
                } else {
                    throw authErr;
                }
            }

            // 2. Guardar en Firebase DB
            await set(ref(db, `config/administradores/${hash}`), {
                rol:      Number(newRol),
                password: creationMode === 'manual' ? newPassword : '(Acceso por correo de invitación)',
            });

            // 3. Si es modo invitación: enviar correo de reset
            if (creationMode === 'invite') {
                try {
                    await sendPasswordResetEmail(auth, email);
                    alert(`✅ Invitación enviada a "${email}".
El admin recibirá un correo para establecer su propia contraseña.${accountCreated ? '' : '\n(La cuenta ya existía, se reenviará el correo de recuperación)'}`);
                } catch (resetErr) {
                    alert(`⚠️ Cuenta creada pero no se pudo enviar el correo: ${resetErr.message}\nEl admin puede solicitar él mismo un correo de recuperación desde el login.`);
                }
            } else {
                alert(`✅ Admin "${email}" creado con Rol ${ROLES_CONFIG[newRol].label}.\nSu acceso está activo con la contraseña asignada.`);
            }

            setNewEmail('');
            setNewRol(2);
            setNewPassword('');
            if (refetchData) refetchData();

        } catch (err) {
            console.error(err);
            alert(`❌ Error al crear el admin: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Cambiar rol ────────────────────────────────────────────────────────────
    const handleChangeRol = async (hash, email, currentEntry, nuevoRol) => {
        if (hash === currentHash && Number(nuevoRol) !== 1) {
            alert('No puedes cambiar tu propio rol de Super Admin.');
            return;
        }
        setSavingHash(hash);
        try {
            await set(ref(db, `config/administradores/${hash}`), {
                rol:      Number(nuevoRol),
                password: currentEntry.password || '',
            });
            if (refetchData) refetchData();
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        } finally {
            setSavingHash('');
        }
    };

    // ── Abrir modal cambiar contraseña ─────────────────────────────────────────
    const openChangePass = (hash, email) => {
        setChangingHash(hash);
        setChangeEmail(email);
        setChangePassword('');
        setShowChangePass(false);
    };

    // ── Guardar nueva contraseña ───────────────────────────────────────────────
    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!changePassword || changePassword.length < 6) { alert('Mínimo 6 caracteres.'); return; }
        setSaving(true);

        const entry = adminList.find(a => a.hash === changingHash);
        const secondaryAuth = getSecondaryAuth();
        let firebaseAuthUpdated = false;

        try {
            // Intentar actualizar Firebase Auth via la app secundaria
            if (entry?.password) {
                try {
                    const cred = await signInWithEmailAndPassword(secondaryAuth, changeEmail, entry.password);
                    await updatePassword(cred.user, changePassword);
                    firebaseAuthUpdated = true;
                } catch (authErr) {
                    // Si falla el login con la contraseña antigua (administrador la cambió por su cuenta),
                    // solo actualizamos el registro en DB y advertimos.
                    console.warn('No se pudo actualizar Firebase Auth:', authErr.message);
                }
            }

            // Guardar nueva contraseña en DB siempre
            await set(ref(db, `config/administradores/${changingHash}`), {
                rol:      entry?.rol ?? 2,
                password: changePassword,
            });

            const nota = firebaseAuthUpdated
                ? '✅ Contraseña actualizada correctamente en el portal.'
                : '⚠️ Contraseña guardada en el registro. El admin deberá usar la nueva contraseña la próxima vez que la app la sincronice.';
            alert(nota);
            setChangingHash(null);
            if (refetchData) refetchData();

        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Eliminar admin ─────────────────────────────────────────────────────────
    const handleRemove = async (hash, email) => {
        if (hash === currentHash) { alert('No puedes eliminarte a ti mismo.'); return; }
        if (!window.confirm(`¿Eliminar el acceso de "${email}"?\nNo podrá acceder al panel, pero su cuenta de correo no se borra.`)) return;
        setSavingHash(hash);
        try {
            await set(ref(db, `config/administradores/${hash}`), null);
            if (refetchData) refetchData();
        } catch (err) {
            alert(`❌ Error: ${err.message}`);
        } finally {
            setSavingHash('');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 fade-in-up">

            {/* ── TABLA ────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-lg">🔐 Administradores Activos</h4>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-bold">
                        {adminList.length} usuario{adminList.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/50">
                                <th className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Correo</th>
                                <th className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Rol</th>
                                <th className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Contraseña</th>
                                <th className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Cambiar Rol</th>
                                <th className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adminList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-sm">
                                        No hay administradores configurados.
                                    </td>
                                </tr>
                            ) : adminList.map(entry => (
                                <tr
                                    key={entry.hash}
                                    className={`border-b border-gray-50 dark:border-slate-700/50 transition-colors ${
                                        entry.hash === currentHash
                                            ? 'bg-blue-50/40 dark:bg-blue-900/10'
                                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                                    } ${savingHash === entry.hash ? 'opacity-60' : ''}`}
                                >
                                    {/* Correo */}
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{entry.email}</span>
                                            {entry.hash === currentHash && (
                                                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">Tú</span>
                                            )}
                                        </div>
                                    </td>
                                    {/* Rol badge */}
                                    <td className="px-5 py-3"><RoleBadge rol={entry.rol} /></td>
                                    {/* Contraseña */}
                                    <td className="px-5 py-3"><PasswordCell password={entry.password} /></td>
                                    {/* Selector de rol */}
                                    <td className="px-5 py-3">
                                        <select
                                            value={entry.rol}
                                            onChange={e => handleChangeRol(entry.hash, entry.email, entry, e.target.value)}
                                            disabled={savingHash === entry.hash || entry.hash === currentHash}
                                            className="text-xs p-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-900 text-gray-900 dark:text-gray-200 font-medium focus:ring-2 focus:ring-[#003366] outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value={1}>🔴 Super Admin</option>
                                            <option value={2}>🟡 Admin</option>
                                            <option value={3}>🟢 Soporte</option>
                                        </select>
                                    </td>
                                    {/* Acciones */}
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openChangePass(entry.hash, entry.email)}
                                                disabled={savingHash === entry.hash}
                                                className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg transition-colors cursor-pointer disabled:opacity-40 border border-blue-100 dark:border-blue-900/40"
                                            >
                                                🔑 Contraseña
                                            </button>
                                            <button
                                                onClick={() => handleRemove(entry.hash, entry.email)}
                                                disabled={savingHash === entry.hash || entry.hash === currentHash}
                                                className="px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors cursor-pointer disabled:opacity-40 border border-red-100 dark:border-red-900/40"
                                            >
                                                ❌ Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── AGREGAR NUEVO ADMIN ──────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                <h4 className="m-0 mb-1 text-[#003366] dark:text-blue-400 font-bold text-lg">➕ Agregar Administrador</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    La cuenta se crea en Firebase Auth automáticamente. Elige cómo asignar la contraseña.
                </p>

                {/* Toggle modo creación */}
                <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl border border-gray-200 dark:border-slate-600 max-w-xs mb-5">
                    <button
                        type="button"
                        onClick={() => setCreationMode('invite')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            creationMode === 'invite'
                                ? 'bg-white dark:bg-slate-800 text-[#003366] dark:text-blue-400 shadow-sm'
                                : 'text-gray-500'
                        }`}
                    >
                        📧 Enviar invitación
                    </button>
                    <button
                        type="button"
                        onClick={() => setCreationMode('manual')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            creationMode === 'manual'
                                ? 'bg-white dark:bg-slate-800 text-[#003366] dark:text-blue-400 shadow-sm'
                                : 'text-gray-500'
                        }`}
                    >
                        🔑 Asignar contraseña
                    </button>
                </div>

                {/* Info según modo */}
                {creationMode === 'invite' ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3.5 text-xs text-blue-800 dark:text-blue-300 mb-4 leading-relaxed">
                        📧 El sistema creará la cuenta y enviará un correo de activación. El admin elige su propia contraseña al hacer clic en el enlace.
                    </div>
                ) : (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300 mb-4 leading-relaxed">
                        🔑 Tú asignas la contraseña y queda visible en esta tabla. Le informas al admin sus credenciales.
                    </div>
                )}
                <form onSubmit={handleAdd}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        {/* Email */}
                        <div className="sm:col-span-1 flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Correo electrónico</label>
                            <input
                                type="text"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder="admin@unimagdalena.edu.co"
                                className={inputCls}
                                required
                            />
                        </div>
                        {/* Contraseña — solo si modo manual */}
                        {creationMode === 'manual' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contraseña inicial</label>
                            <div className="relative">
                                <input
                                    type={showNewPass ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className={`${inputCls} pr-10`}
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-sm"
                                >
                                    {showNewPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        )}
                        {/* Rol */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</label>
                            <select
                                value={newRol}
                                onChange={e => setNewRol(Number(e.target.value))}
                                className={inputCls}
                            >
                                <option value={1}>🔴 Super Admin</option>
                                <option value={2}>🟡 Admin</option>
                                <option value={3}>🟢 Soporte</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-[#003366] hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-md"
                    >
                        {saving
                            ? '⏳ Procesando...'
                            : creationMode === 'invite'
                            ? '📧 Crear Cuenta y Enviar Invitación'
                            : '➕ Crear Admin con Contraseña Asignada'}
                    </button>
                </form>
            </div>

            {/* ── REFERENCIA DE ROLES ──────────────────────────────────────── */}
            <div>
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Referencia de permisos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(ROLES_CONFIG).map(([rol, cfg]) => (
                        <div key={rol} className={`p-5 rounded-2xl border ${cfg.colorCard}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">{cfg.emoji}</span>
                                <p className="m-0 font-bold text-gray-800 dark:text-gray-200 text-sm">Rol {rol} — {cfg.label}</p>
                            </div>
                            <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                                {cfg.permisos.map(p => (
                                    <li key={p} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MODAL CAMBIAR CONTRASEÑA ─────────────────────────────────── */}
            {changingHash && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-[0_30px_60px_rgba(0,0,0,0.3)] fade-in-up border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="m-0 text-xl font-bold text-[#003366] dark:text-blue-400">🔑 Cambiar Contraseña</h3>
                            <button onClick={() => setChangingHash(null)} disabled={saving} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-2 bg-gray-50 dark:bg-slate-700 rounded-full transition-colors cursor-pointer">✕</button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            Cambiando contraseña de <strong className="text-gray-700 dark:text-gray-200">{changeEmail}</strong>
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-300 mb-5">
                            La nueva contraseña quedará visible para el Super Admin y se actualizará en el acceso al portal.
                        </div>
                        <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nueva Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showChangePass ? 'text' : 'password'}
                                        value={changePassword}
                                        onChange={e => setChangePassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className={`${inputCls} pr-10`}
                                        minLength={6}
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowChangePass(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-sm"
                                    >
                                        {showChangePass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-[#003366] hover:bg-blue-800 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-md text-sm"
                            >
                                {saving ? '⏳ Actualizando...' : '💾 Guardar Nueva Contraseña'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRolesTab;
