import React, { useState, useEffect } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { useAdminUploader } from '../hooks/useAdminUploader';
import { useAdminScheduleUploader } from '../hooks/useAdminScheduleUploader';

// Tabs
import AdminDatosTab      from './admin/tabs/AdminDatosTab';
import AdminRadarTab      from './admin/tabs/AdminRadarTab';
import AdminAnalyticsTab  from './admin/tabs/AdminAnalyticsTab';
import AdminCrmTab        from './admin/tabs/AdminCrmTab';
import AdminRolesTab      from './admin/tabs/AdminRolesTab';

// ─── Definición de tabs ───────────────────────────────────────────────────────
// minRol: rol máximo permitido (1 = solo superadmin, 2 = admin+, 3 = todos)
const TABS = [
    { id: 'datos',      label: '⚙️ Datos',      minRol: 1 },
    { id: 'directorio', label: '👥 Directorio',  minRol: 2 },
    { id: 'analytics',  label: '📊 Analytics',   minRol: 2 },
    { id: 'roles',      label: '🔐 Roles',       minRol: 1 },
];

// Un usuario con rol N puede ver el tab si su rol <= el minRol del tab
const canSeeTab = (userRole, tab) => userRole <= tab.minRol;

const getDefaultTab = (userRole) => {
    if (userRole >= 3) return 'crm';
    if (userRole === 2) return 'directorio';
    return 'datos';
};

// ─── Componente de navegación ─────────────────────────────────────────────────
const TabNav = ({ tabs, activeTab, setActiveTab, userRole }) => (
    <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-2xl border border-gray-200 dark:border-slate-600 flex-wrap gap-1">
        {tabs.filter(t => canSeeTab(userRole, t)).map(t => (
            <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2.5 px-3 min-w-[100px] text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === t.id
                        ? t.id === 'crm'
                            ? 'bg-[#003366] text-white shadow-sm'
                            : t.id === 'roles'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-[#003366] dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
                {t.label}
            </button>
        ))}
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════
const AdminPanel = ({ currentUser, onBack, onSelectDocente, onLogout }) => {
    const adminData        = useAdminData();
    const studentUploader  = useAdminUploader();
    const scheduleUploader = useAdminScheduleUploader();

    // Calcular rol del usuario actual — compatible con formato antiguo (número) y nuevo ({rol, password})
    const adminEmail = currentUser?.email || '';
    const adminHash  = adminEmail.replace(/\./g, '_');
    const rawAdminVal = adminData.adminRoles?.[adminHash];
    const userRole = typeof rawAdminVal === 'object' && rawAdminVal !== null
        ? (rawAdminVal.rol ?? 1)
        : (rawAdminVal ?? 1);

    // Tab activo — se ajusta una vez que el rol está disponible
    const [activeTab, setActiveTab]     = useState('directorio'); // safe default visible por todos
    const [tabInitialized, setTabInitialized] = useState(false);

    useEffect(() => {
        if (!adminData.loadingDocentes && !tabInitialized) {
            setActiveTab(getDefaultTab(userRole));
            setTabInitialized(true);
        }
    }, [adminData.loadingDocentes, userRole, tabInitialized]);

    // Si el tab activo ya no es accesible para el rol, redirigir
    useEffect(() => {
        const current = TABS.find(t => t.id === activeTab);
        if (current && !canSeeTab(userRole, current)) {
            setActiveTab(getDefaultTab(userRole));
        }
    }, [userRole, activeTab]);

    const [statsDateRange, setStatsDateRange] = useState('7');

    const handleUnifiedUpload = async (event, program, mode) => {
        if (mode === 'unified') {
            // Opción A: mismo archivo tiene info de docentes Y horarios
            const file = event.target.files?.[0];
            if (!file) return;
            const makeEvent = (f) => ({ target: { files: [f] } });
            await studentUploader.handleFileUpload(makeEvent(file), program);
            await scheduleUploader.handleScheduleUpload(makeEvent(file), program);
        } else if (mode === 'students') {
            studentUploader.handleFileUpload(event, program);
        } else {
            scheduleUploader.handleScheduleUpload(event, program);
        }
    };

    const isUploading      = studentUploader.uploading || scheduleUploader.uploading;
    const currentUploadResult = studentUploader.uploadResult || scheduleUploader.uploadResult;

    return (
        <div className="min-h-screen bg-[#f4f6f8] dark:bg-slate-900 p-4 md:p-6 flex flex-col items-center font-sans transition-colors duration-300">
            <div className="fade-in-up w-full max-w-6xl bg-white dark:bg-slate-800 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none transition-colors duration-300 overflow-hidden">

                {/* ── HEADER ───────────────────────────────────────────────── */}
                <div className="px-6 md:px-8 py-5 border-b border-gray-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#003366] flex items-center justify-center text-white font-black text-lg">C</div>
                        <div>
                            <h2 className="text-[#003366] dark:text-blue-400 m-0 text-lg font-black tracking-tight">PANEL CREO</h2>
                            <p className="text-gray-400 dark:text-gray-500 m-0 text-xs">
                                {adminEmail}
                                {' · '}
                                <span className={`font-bold ${userRole === 1 ? 'text-red-500' : userRole === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {userRole === 1 ? '🔴 Super Admin' : userRole === 2 ? '🟡 Admin' : '🟢 Soporte'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onBack}
                            className="cursor-pointer px-4 py-2 rounded-full border-none bg-gray-100 dark:bg-slate-700 font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm"
                        >
                            ⬅ Volver
                        </button>
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="cursor-pointer px-4 py-2 rounded-full border-none bg-red-100 dark:bg-red-900/30 font-bold text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                            >
                                Salir
                            </button>
                        )}
                    </div>
                </div>

                {/* ── NAVEGACIÓN DE TABS ────────────────────────────────────── */}
                <div className="px-6 md:px-8 pt-5 pb-4">
                    <TabNav
                        tabs={TABS}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        userRole={userRole}
                    />
                </div>

                {/* ── CONTENIDO DEL TAB ACTIVO ──────────────────────────────── */}
                <div className="px-6 md:px-8 pb-8">

                    {/* ⚙️ Datos — solo Rol 1 */}
                    {activeTab === 'datos' && userRole === 1 && (
                        <AdminDatosTab
                            uploading={isUploading}
                            uploadResult={currentUploadResult}
                            onFileUpload={handleUnifiedUpload}
                            onDelete={studentUploader.handleDeleteDatabase}
                            stats={adminData.programStats}
                            anuncioData={adminData.anuncioData}
                        />
                    )}

                    {/* 👥 Directorio — Rol 1 y 2 */}
                    {activeTab === 'directorio' && userRole <= 2 && (
                        <AdminRadarTab
                            loadingDocentes={adminData.loadingDocentes}
                            docentesList={adminData.docentesList}
                            onSelectDocente={onSelectDocente}
                            refetchData={adminData.refetchData}
                        />
                    )}

                    {/* 📊 Analytics — Rol 1 y 2 */}
                    {activeTab === 'analytics' && userRole <= 2 && (
                        <AdminAnalyticsTab
                            fullAnalytics={adminData.fullAnalytics}
                            fullLogs={adminData.fullLogs}
                            docentesListLength={adminData.docentesList.length}
                            docentesListFull={adminData.docentesListFull}
                            eventsData={adminData.eventsData}
                            statsDateRange={statsDateRange}
                            setStatsDateRange={setStatsDateRange}
                            logs={adminData.logs}
                        />
                    )}

                    {/* 🔐 Roles — solo Rol 1 */}
                    {activeTab === 'roles' && userRole === 1 && (
                        <AdminRolesTab
                            adminRoles={adminData.adminRoles}
                            currentUser={currentUser}
                            refetchData={adminData.refetchData}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
