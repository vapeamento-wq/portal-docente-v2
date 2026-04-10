import React, { useState } from 'react';
import { db, ref, get, set, update } from '../../../services/firebase';
import { hashDocumento } from '../../../utils/helpers';

const PROGRAMAS = [
    { value: 'SN',   label: 'Semestre de Nivelación' },
    { value: 'SST',  label: 'SST' },
    { value: 'AP',   label: 'Administración Pública' },
    { value: 'P500', label: '500 x 500' },
    { value: 'VOC',  label: 'Vocacional' },
];

const PROGRAMA_LABEL = {
    SN:   'Nivelación',
    SST:  'SST',
    AP:   'Adm. Pública',
    P500: '500x500',
    VOC:  'Vocacional',
};

const getTargetProgram = (programaStr = '') => {
    const s = programaStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (s.includes('NIVELACION') || s === 'SN') return 'SN';
    if (s.includes('ADMINISTRACION') || s.includes('PUBLICA') || s === 'AP') return 'AP';
    if (s.includes('500')) return 'P500';
    return 'SST';
};

const EMPTY_FORM = {
    id: '',
    visualId: '',
    nombre: '',
    targetProgram: 'SN',
    grupo: '',
    pago: 'SI',
    correoInstitucional: '',
    codigo: '',
};

// ─── Badge de Pago ────────────────────────────────────────────────────────────
const PagoBadge = ({ pago }) => {
    const val = String(pago || '').toUpperCase().trim();
    const esSi = val === 'SI' || val === 'S' || val === 'SÍ';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
            esSi
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${esSi ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {esSi ? 'SI' : 'NO'}
        </span>
    );
};

// ─── Toggle SI / NO ───────────────────────────────────────────────────────────
const PagoToggle = ({ value, onChange }) => {
    const esSi = String(value || '').toUpperCase().trim() === 'SI';
    return (
        <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-slate-600 w-fit">
            <button
                type="button"
                onClick={() => onChange('SI')}
                className={`px-5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                    esSi
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
            >
                ✅ SI — Pagó
            </button>
            <button
                type="button"
                onClick={() => onChange('NO')}
                className={`px-5 py-2.5 text-sm font-bold transition-colors cursor-pointer border-l border-gray-300 dark:border-slate-600 ${
                    !esSi
                        ? 'bg-red-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
            >
                ❌ NO — Pendiente
            </button>
        </div>
    );
};

// ─── Selector de Programa ─────────────────────────────────────────────────────
const ProgramaSelect = ({ value, onChange, className = '' }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full p-4 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 outline-none transition-all ${className}`}
    >
        {PROGRAMAS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
        ))}
    </select>
);

// ─── Chip de Programa ─────────────────────────────────────────────────────────
const ProgramaChip = ({ targetProgram }) => {
    const label = PROGRAMA_LABEL[targetProgram] || targetProgram || '—';
    const colors = {
        SN:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        SST:  'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
        AP:   'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        P500: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
        VOC:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[targetProgram] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}>
            {label}
        </span>
    );
};

// ─── Campo de formulario ──────────────────────────────────────────────────────
const Field = ({ label, children }) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            {label}
        </label>
        {children}
    </div>
);

const inputCls = "w-full p-3.5 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 outline-none transition-all text-sm";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const AdminRadarTab = ({ loadingDocentes, docentesList, onSelectDocente, refetchData }) => {
    const [editingDocente, setEditingDocente]   = useState(null);
    const [editFormData,   setEditFormData]     = useState(EMPTY_FORM);
    const [savingEdit,     setSavingEdit]       = useState(false);
    const [showAddModal,   setShowAddModal]     = useState(false);
    const [addFormData,    setAddFormData]      = useState(EMPTY_FORM);
    const [savingAdd,      setSavingAdd]        = useState(false);
    const [filterDocente,  setFilterDocente]    = useState('');
    const [filterPrograma, setFilterPrograma]   = useState('');
    const [filterPago,     setFilterPago]       = useState('');

    // ── Helpers ───────────────────────────────────────────────────────────────
    const setEdit = (key, val) => setEditFormData(prev => ({ ...prev, [key]: val }));
    const setAdd  = (key, val) => setAddFormData(prev => ({ ...prev, [key]: val }));

    // ── Abrir modal edición ───────────────────────────────────────────────────
    const openEditModal = (d) => {
        setEditingDocente(d);
        setEditFormData({
            id:                  d.id,
            visualId:            d.visualId,
            nombre:              d.nombre,
            targetProgram:       d.targetProgram || getTargetProgram(d.programa),
            grupo:               d.grupo || '',
            pago:                String(d.pago || 'NO').toUpperCase() === 'SI' ? 'SI' : 'NO',
            correoInstitucional: d.correoInstitucional || '',
            codigo:              d.codigo || '',
        });
    };

    // ── Guardar edición ───────────────────────────────────────────────────────
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        try {
            const { id: oldHash, visualId: newVisualId, nombre: newNombre, targetProgram, grupo, pago, correoInstitucional, codigo } = editFormData;

            if (!oldHash || !newVisualId || !newNombre) {
                alert('El nombre y el documento son obligatorios.');
                setSavingEdit(false);
                return;
            }

            const snapshot = await get(ref(db, `docentes/${oldHash}`));
            const docData  = snapshot.val();
            if (!docData) { alert('El estudiante no existe en la base de datos.'); setSavingEdit(false); return; }

            const programaLabel = PROGRAMAS.find(p => p.value === targetProgram)?.label || targetProgram;
            const cambios = { nombre: newNombre, targetProgram, programa: programaLabel, grupo, pago, correoInstitucional, codigo, lastUpdate: new Date().toISOString() };

            if (newVisualId === editingDocente.visualId) {
                await update(ref(db, `docentes/${oldHash}`), cambios);
            } else {
                const newHash   = await hashDocumento(newVisualId);
                const checkSnap = await get(ref(db, `docentes/${newHash}`));
                if (checkSnap.exists()) {
                    const ok = window.confirm(`¡Atención! Ya existe un estudiante con el documento ${newVisualId}. ¿Deseas fusionar/sobreescribir su información?`);
                    if (!ok) { setSavingEdit(false); return; }
                }
                await set(ref(db, `docentes/${newHash}`), { ...docData, ...cambios, idReal: newVisualId, hashId: newHash });
                await set(ref(db, `docentes/${oldHash}`), null);
            }

            alert('✅ Docente actualizado exitosamente');
            setEditingDocente(null);
            if (refetchData) refetchData();
        } catch (err) {
            console.error(err);
            alert('❌ Ocurrió un error guardando.');
        } finally {
            setSavingEdit(false);
        }
    };

    // ── Eliminar ──────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!window.confirm(`🛑 ¿Estás seguro de eliminar PERMANENTEMENTE a ${editingDocente.nombre}? Esta acción no se puede deshacer.`)) return;
        setSavingEdit(true);
        try {
            await set(ref(db, `docentes/${editingDocente.id}`), null);
            alert('🗑️ Docente eliminado exitosamente.');
            setEditingDocente(null);
            if (refetchData) refetchData();
        } catch (err) {
            console.error(err);
            alert('❌ Ocurrió un error al eliminar.');
        } finally {
            setSavingEdit(false);
        }
    };

    // ── Agregar nuevo estudiante ──────────────────────────────────────────────
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setSavingAdd(true);
        try {
            const { visualId, nombre, targetProgram, grupo, pago, correoInstitucional, codigo } = addFormData;
            if (!visualId || !nombre) { alert('El nombre y el documento son obligatorios.'); setSavingAdd(false); return; }

            const hash      = await hashDocumento(visualId);
            const existing  = await get(ref(db, `docentes/${hash}`));
            if (existing.exists()) {
                const ok = window.confirm(`Ya existe un estudiante con el documento ${visualId} (${existing.val().nombre}). ¿Deseas sobreescribir su información?`);
                if (!ok) { setSavingAdd(false); return; }
            }

            const programaLabel = PROGRAMAS.find(p => p.value === targetProgram)?.label || targetProgram;
            await set(ref(db, `docentes/${hash}`), {
                idReal: visualId,
                nombre,
                targetProgram,
                programa: programaLabel,
                grupo: grupo || 'Pendiente',
                pago,
                correoInstitucional: correoInstitucional || '',
                codigo: codigo || 'Pendiente',
                hashId: hash,
                lastUpdate: new Date().toISOString(),
            });

            alert(`✅ Docente "${nombre}" agregado exitosamente.`);
            setShowAddModal(false);
            setAddFormData(EMPTY_FORM);
            if (refetchData) refetchData();
        } catch (err) {
            console.error(err);
            alert('❌ Ocurrió un error al agregar el estudiante.');
        } finally {
            setSavingAdd(false);
        }
    };

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const filtered = docentesList.filter(d => {
        const q = filterDocente.toLowerCase();
        const matchSearch = !q ||
            d.nombre.toLowerCase().includes(q) ||
            d.visualId.includes(q) ||
            (d.codigo || '').toLowerCase().includes(q) ||
            (d.correoInstitucional || '').toLowerCase().includes(q);
        const matchPrograma = !filterPrograma || d.targetProgram === filterPrograma;
        const matchPago = !filterPago ||
            (filterPago === 'SI' && String(d.pago || '').toUpperCase() === 'SI') ||
            (filterPago === 'NO' && String(d.pago || '').toUpperCase() !== 'SI');
        return matchSearch && matchPrograma && matchPago;
    });

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="grid grid-cols-1 gap-6 fade-in-up">

            {/* ── DIRECTORIO ─────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors overflow-hidden flex flex-col">

                {/* Cabecera */}
                <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                    <div className="flex items-center gap-3">
                        <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-xl">
                            👥 Directorio Sincronizado
                        </h4>
                        <span className="bg-[#003366]/10 text-[#003366] dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">
                            {filtered.length} / {docentesList.length}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Buscador */}
                        <input
                            type="text"
                            placeholder="Buscar por nombre, doc. o correo..."
                            value={filterDocente}
                            onChange={e => setFilterDocente(e.target.value)}
                            className="p-2.5 w-52 md:w-64 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all text-sm"
                        />
                        {/* Filtro programa */}
                        <select
                            value={filterPrograma}
                            onChange={e => setFilterPrograma(e.target.value)}
                            className="p-2.5 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all cursor-pointer"
                        >
                            <option value="">Todos los programas</option>
                            {PROGRAMAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        {/* Filtro pago */}
                        <select
                            value={filterPago}
                            onChange={e => setFilterPago(e.target.value)}
                            className="p-2.5 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all cursor-pointer"
                        >
                            <option value="">Todos los pagos</option>
                            <option value="SI">✅ Pagó</option>
                            <option value="NO">❌ Pendiente</option>
                        </select>
                        {/* Botón agregar */}
                        <button
                            onClick={() => { setAddFormData(EMPTY_FORM); setShowAddModal(true); }}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#003366] hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-md whitespace-nowrap"
                        >
                            ➕ Nuevo Docente
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-auto rounded-xl border border-gray-100 dark:border-slate-700" style={{ maxHeight: '560px' }}>
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-slate-700/80 z-10">
                            <tr>
                                <th className="p-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Nombre</th>
                                <th className="p-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Documento</th>
                                <th className="p-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Programa</th>
                                <th className="p-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Grupo</th>
                                <th className="p-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Pago</th>
                                <th className="p-3 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingDocentes ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-gray-500">
                                        <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#003366] dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Cargando docentes de Firebase...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400 dark:text-gray-500">
                                        {docentesList.length === 0
                                            ? 'No hay docentes sincronizados. Sube el Excel o agrega uno manualmente.'
                                            : 'Sin resultados para los filtros aplicados.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(d => (
                                    <tr
                                        key={d.id}
                                        className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors group"
                                    >
                                        <td
                                            className="p-3 font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#003366] dark:group-hover:text-blue-400 transition-colors cursor-pointer text-sm"
                                            onClick={() => onSelectDocente(d.id, d.visualId)}
                                        >
                                            {d.nombre}
                                        </td>
                                        <td
                                            className="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs cursor-pointer"
                                            onClick={() => onSelectDocente(d.id, d.visualId)}
                                        >
                                            {d.visualId}
                                        </td>
                                        <td className="p-3" onClick={() => onSelectDocente(d.id, d.visualId)}>
                                            <ProgramaChip targetProgram={d.targetProgram || getTargetProgram(d.programa)} />
                                        </td>
                                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs cursor-pointer" onClick={() => onSelectDocente(d.id, d.visualId)}>
                                            {d.grupo || '—'}
                                        </td>
                                        <td className="p-3 cursor-pointer" onClick={() => onSelectDocente(d.id, d.visualId)}>
                                            <PagoBadge pago={d.pago} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={e => { e.stopPropagation(); openEditModal(d); }}
                                                className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 dark:bg-slate-700 dark:hover:bg-blue-900/60 dark:text-gray-300 dark:hover:text-blue-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                            >
                                                ✏️ Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODAL EDICIÓN ──────────────────────────────────────────────── */}
            {editingDocente && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-[0_30px_60px_rgba(0,0,0,0.3)] fade-in-up border border-gray-100 dark:border-slate-700 my-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="m-0 text-xl font-bold text-[#003366] dark:text-blue-400">✏️ Editar Docente</h3>
                            <button onClick={() => setEditingDocente(null)} disabled={savingEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors cursor-pointer">✕</button>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3.5 rounded-xl border-l-4 border-blue-500 mb-5 text-xs text-blue-800 dark:text-blue-200">
                            <strong>Nota:</strong> Al cambiar el documento se recalcula el identificador interno y se preservan los datos existentes.
                        </div>

                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                            <Field label="Nombre Completo">
                                <input type="text" value={editFormData.nombre} onChange={e => setEdit('nombre', e.target.value)} className={inputCls} required />
                            </Field>
                            <Field label="Documento / Cédula">
                                <input type="text" value={editFormData.visualId} onChange={e => setEdit('visualId', e.target.value.replace(/\D/g, ''))} className={`${inputCls} font-mono tracking-widest text-[#003366] dark:text-blue-400`} required />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Programa">
                                    <ProgramaSelect value={editFormData.targetProgram} onChange={v => setEdit('targetProgram', v)} className="p-3 text-sm" />
                                </Field>
                                <Field label="Grupo">
                                    <input type="text" value={editFormData.grupo} onChange={e => setEdit('grupo', e.target.value)} placeholder="Ej: G1" className={inputCls} />
                                </Field>
                            </div>

                            <Field label="Código Institucional">
                                <input type="text" value={editFormData.codigo} onChange={e => setEdit('codigo', e.target.value)} placeholder="Ej: 20251234" className={inputCls} />
                            </Field>

                            <Field label="Correo Institucional">
                                <input type="text" value={editFormData.correoInstitucional} onChange={e => setEdit('correoInstitucional', e.target.value)} placeholder="estudiante@institución.edu.co" className={inputCls} />
                            </Field>

                            <Field label="Estado de Pago">
                                <PagoToggle value={editFormData.pago} onChange={v => setEdit('pago', v)} />
                            </Field>

                            <div className="mt-2 flex gap-3 flex-col sm:flex-row">
                                <button type="submit" disabled={savingEdit} className="flex-1 py-3 px-4 bg-[#003366] hover:bg-blue-800 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-md text-sm">
                                    {savingEdit ? '⏳ Procesando...' : '💾 Guardar Cambios'}
                                </button>
                                <button type="button" onClick={handleDelete} disabled={savingEdit} className="py-3 px-5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-800/60 font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 border border-red-200 dark:border-red-800 text-sm">
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL AGREGAR NUEVO ESTUDIANTE ────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-[0_30px_60px_rgba(0,0,0,0.3)] fade-in-up border border-gray-100 dark:border-slate-700 my-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="m-0 text-xl font-bold text-[#003366] dark:text-blue-400">➕ Nuevo Docente</h3>
                            <button onClick={() => setShowAddModal(false)} disabled={savingAdd} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors cursor-pointer">✕</button>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3.5 rounded-xl border-l-4 border-emerald-500 mb-5 text-xs text-emerald-800 dark:text-emerald-200">
                            El estudiante quedará disponible inmediatamente en el buscador del portal.
                        </div>

                        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                            <Field label="Nombre Completo *">
                                <input type="text" value={addFormData.nombre} onChange={e => setAdd('nombre', e.target.value)} placeholder="Apellidos y Nombres" className={inputCls} required />
                            </Field>
                            <Field label="Documento / Cédula *">
                                <input type="text" value={addFormData.visualId} onChange={e => setAdd('visualId', e.target.value.replace(/\D/g, ''))} placeholder="Solo números" className={`${inputCls} font-mono tracking-widest text-[#003366] dark:text-blue-400`} required />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Programa *">
                                    <ProgramaSelect value={addFormData.targetProgram} onChange={v => setAdd('targetProgram', v)} className="p-3 text-sm" />
                                </Field>
                                <Field label="Grupo">
                                    <input type="text" value={addFormData.grupo} onChange={e => setAdd('grupo', e.target.value)} placeholder="Ej: G1" className={inputCls} />
                                </Field>
                            </div>

                            <Field label="Código Institucional">
                                <input type="text" value={addFormData.codigo} onChange={e => setAdd('codigo', e.target.value)} placeholder="Ej: 20251234" className={inputCls} />
                            </Field>

                            <Field label="Correo Institucional">
                                <input type="text" value={addFormData.correoInstitucional} onChange={e => setAdd('correoInstitucional', e.target.value)} placeholder="estudiante@institución.edu.co" className={inputCls} />
                            </Field>

                            <Field label="Estado de Pago">
                                <PagoToggle value={addFormData.pago} onChange={v => setAdd('pago', v)} />
                            </Field>

                            <div className="mt-2">
                                <button type="submit" disabled={savingAdd} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-md text-sm">
                                    {savingAdd ? '⏳ Agregando...' : '✅ Agregar Docente a Firebase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRadarTab;
