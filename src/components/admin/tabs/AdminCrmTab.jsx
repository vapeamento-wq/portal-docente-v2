import React, { useState } from 'react';
import { db, ref, update } from '../../../services/firebase';

const AdminCrmTab = ({ tickets }) => {
    const [filterStatus, setFilterStatus] = useState('Todos');

    const filteredTickets = tickets.filter(ticket => {
        if (filterStatus === 'Todos') return true;
        return ticket.estado === filterStatus;
    });

    const handleActualizarEstado = async (ticketId, nuevoEstado) => {
        try {
            const ticketRef = ref(db, `errores/${ticketId}`);
            await update(ticketRef, {
                estado: nuevoEstado,
                fecha_actualizacion: new Date().toISOString()
            });
            // La UI se actualizará al recibir los nuevos datos del hook
        } catch (error) {
            console.error("Error al actualizar ticket:", error);
            alert("No se pudo actualizar el estado del ticket.");
        }
    };

    const getSLAStatus = (ticket) => {
        if (ticket.estado === 'Resuelto') return { color: 'text-green-500', bg: 'bg-green-100', text: '✅ Completado' };
        
        const deadline = new Date(ticket.sla_deadline);
        const now = new Date();
        const diffHours = (deadline - now) / (1000 * 60 * 60);

        if (diffHours < 0) return { color: 'text-red-500', bg: 'bg-red-100', text: '🚨 Vencido' };
        if (diffHours < 12) return { color: 'text-orange-500', bg: 'bg-orange-100', text: '⚠️ Crítico' };
        return { color: 'text-blue-500', bg: 'bg-blue-100', text: '🕒 A Tiempo' };
    };

    return (
        <div className="fade-in-up w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#003366] dark:text-blue-400">Panel de Service Desk (CRM)</h3>
                
                <div className="flex gap-2">
                    {['Todos', 'Abierto', 'En Proceso', 'Resuelto'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                                filterStatus === status 
                                    ? 'bg-[#003366] text-white border-[#003366]' 
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center shadow-sm border border-slate-200 dark:border-slate-700">
                    <span className="text-4xl">📭</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold">No hay tickets {filterStatus !== 'Todos' ? filterStatus.toLowerCase() : ''} en este momento.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredTickets.map(ticket => {
                        const slaStatus = getSLAStatus(ticket);
                        return (
                            <div key={ticket.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-5 items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                                            {ticket.categoria}
                                        </span>
                                        {ticket.prioridad === 'Alta' && (
                                            <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-2 py-1 rounded">
                                                Prioridad Alta
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${slaStatus.bg} ${slaStatus.color}`}>
                                            {slaStatus.text}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{ticket.asunto}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 whitespace-pre-wrap">{ticket.descripcion}</p>
                                    
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                                        <span>👤 {ticket.nombre_estudiante}</span>
                                        <span>🆔 {ticket.id_estudiante}</span>
                                        <span>📅 {new Date(ticket.fecha_creacion).toLocaleString('es-CO')}</span>
                                    </div>
                                </div>
                                
                                <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1 md:text-right">Gestionar Estado</div>
                                    <select
                                        value={ticket.estado}
                                        onChange={(e) => handleActualizarEstado(ticket.id, e.target.value)}
                                        className={`p-2 rounded-lg font-bold border-2 outline-none cursor-pointer transition-colors ${
                                            ticket.estado === 'Resuelto' ? 'bg-green-50 border-green-200 text-green-700' :
                                            ticket.estado === 'En Proceso' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                            'bg-white border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <option value="Abierto">🟠 Abierto</option>
                                        <option value="En Proceso">🟡 En Proceso</option>
                                        <option value="Resuelto">✅ Resuelto</option>
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminCrmTab;
