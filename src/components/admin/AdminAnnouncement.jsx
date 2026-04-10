import React, { useState, useEffect } from 'react';
import { db, ref, set } from '../../services/firebase';

const AdminAnnouncement = ({ initialData }) => {
    const [anuncioGlobal, setAnuncioGlobal] = useState('');
    const [anuncioInicio, setAnuncioInicio] = useState('');
    const [anuncioFin, setAnuncioFin] = useState('');
    const [anuncioUrl, setAnuncioUrl] = useState('');
    const [mantenimientoActivo, setMantenimientoActivo] = useState(false);
    const [guardandoAnuncio, setGuardandoAnuncio] = useState(false);

    useEffect(() => {
        if (initialData) {
            setAnuncioGlobal(initialData.texto || '');
            setAnuncioInicio(initialData.inicio || '');
            setAnuncioFin(initialData.fin || '');
            setAnuncioUrl(initialData.url || '');
            setMantenimientoActivo(Boolean(initialData.mantenimiento));
        }
    }, [initialData]);

    const handleToggleMantenimiento = async () => {
        const nuevoEstado = !mantenimientoActivo;
        const msg = nuevoEstado 
            ? '¿Estás seguro de que quieres ACTIVAR el Modo Mantenimiento? Los estudiantes no podrán consultar sus datos.'
            : '¿Deseas DESACTIVAR el Modo Mantenimiento? El portal volverá a estar disponible para todos.';
        
        if (!window.confirm(msg)) return;

        setGuardandoAnuncio(true);
        try {
            await set(ref(db, 'config/anuncio'), {
                texto: anuncioGlobal,
                inicio: anuncioInicio || null,
                fin: anuncioFin || null,
                url: anuncioUrl || null,
                mantenimiento: nuevoEstado,
                fechaActualizacion: new Date().toISOString()
            });
            setMantenimientoActivo(nuevoEstado);
            alert(`Modo Mantenimiento ${nuevoEstado ? 'ACTIVADO' : 'DESACTIVADO'} con éxito.`);
        } catch (err) {
            console.error(err);
            alert(`Error al cambiar el estado: ${err.message}`);
        } finally {
            setGuardandoAnuncio(false);
        }
    };

    const handleGuardarAnuncio = async (e) => {
        e.preventDefault();
        setGuardandoAnuncio(true);
        try {
            await set(ref(db, 'config/anuncio'), {
                texto: anuncioGlobal,
                inicio: anuncioInicio || null,
                fin: anuncioFin || null,
                url: anuncioUrl || null,
                fechaActualizacion: new Date().toISOString(),
                mantenimiento: mantenimientoActivo
            });
            alert('Anuncio Global actualizado y publicado con éxito.');
        } catch (err) {
            console.error(err);
            alert(`Error al publicar el anuncio: ${err.message}`);
        } finally {
            setGuardandoAnuncio(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
                <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-xl">📢 Anuncios & Mantenimiento</h4>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-200 dark:border-slate-600">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Modo Mantenimiento:</span>
                    <button
                        type="button"
                        onClick={handleToggleMantenimiento}
                        disabled={guardandoAnuncio}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${mantenimientoActivo ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'} ${guardandoAnuncio ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${mantenimientoActivo ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${mantenimientoActivo ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                        {mantenimientoActivo ? 'ACTIVADO' : 'Inactivo'}
                    </span>
                </div>
            </div>

            <form onSubmit={handleGuardarAnuncio} className="flex flex-col gap-4">
                <textarea
                    value={anuncioGlobal}
                    onChange={(e) => setAnuncioGlobal(e.target.value)}
                    placeholder="Escribe un anuncio público aquí. Ej: Bienvenidos al nuevo semestre..."
                    className="w-full p-4 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 transition-all min-h-[100px] resize-y"
                ></textarea>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">URL del Enlace (Opcional)</label>
                    <input
                        type="url"
                        value={anuncioUrl}
                        onChange={(e) => setAnuncioUrl(e.target.value)}
                        placeholder="https://ejemplo.com"
                        className="p-3 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 transition-all text-sm w-full"
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mostrar Desde (Opcional)</label>
                        <input
                            type="datetime-local"
                            value={anuncioInicio}
                            onChange={(e) => setAnuncioInicio(e.target.value)}
                            className="p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#003366] text-sm"
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ocultar El (Opcional)</label>
                        <input
                            type="datetime-local"
                            value={anuncioFin}
                            onChange={(e) => setAnuncioFin(e.target.value)}
                            className="p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#003366] text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                        Si dejas las fechas en blanco y guardas un texto, se mostrará <b>inmediatamente</b> y por tiempo indefinido. Borra el texto para desactivarlo por completo.
                    </span>
                    <button type="submit" disabled={guardandoAnuncio} className="px-6 py-2.5 bg-[#003366] dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-[#002244] dark:hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {guardandoAnuncio ? 'Guardando...' : 'Guardar y Publicar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminAnnouncement;
