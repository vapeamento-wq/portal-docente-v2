import { useState, useEffect } from 'react';
import { db, ref, get } from '../services/firebase';

// ─── useAdminData — Portal Docente ────────────────────────────────────────────
// Identical to student portal's hook but reads from 'docentes' Firebase node.
export const useAdminData = () => {
    const [docentesList, setDocentesList] = useState([]);
    const [docentesListFull, setDocentesListFull] = useState([]);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [loadingDocentes, setLoadingDocentes] = useState(true);
    const [adminRoles, setAdminRoles] = useState({});
    const [tickets, setTickets] = useState([]);

    const [anuncioData, setAnuncioData] = useState({
        texto: '',
        inicio: '',
        fin: '',
        mantenimiento: false
    });

    const [logs, setLogs] = useState([]);
    const [fullLogs, setFullLogs] = useState([]);
    const [fullAnalytics, setFullAnalytics] = useState({});
    const [eventsData, setEventsData] = useState({});
    const [programStats, setProgramStats] = useState({
        SST:  { docentes: 0, cursos: 0 },
        AP:   { docentes: 0, cursos: 0 },
        SN:   { docentes: 0, cursos: 0 },
        P500: { docentes: 0, cursos: 0 },
        VOC:  { docentes: 0, cursos: 0 },
    });

    const [refreshCount, setRefreshCount] = useState(0);
    const refetchData = () => {
        setLoadingDocentes(true);
        setRefreshCount(prev => prev + 1);
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                // ── Docentes ────────────────────────────────────────────────
                const docentesSnap = await get(ref(db, 'docentes'));
                const dataDocentes = docentesSnap.val();
                if (dataDocentes && isMounted) {
                    const list = Object.keys(dataDocentes).map(hashKey => ({
                        id: hashKey,
                        visualId: dataDocentes[hashKey].idReal || 'Docente',
                        nombre: dataDocentes[hashKey].nombre || '',
                        cursosCount: dataDocentes[hashKey].cursos ? dataDocentes[hashKey].cursos.length : 0,
                        programa: dataDocentes[hashKey].programa || '',
                        targetProgram: dataDocentes[hashKey].targetProgram || '',
                        grupo: '',
                        pago: '',
                        correoInstitucional: dataDocentes[hashKey].correo || '',
                        codigo: dataDocentes[hashKey].codigo || '',
                    }));
                    setDocentesList(list);

                    const fullList = Object.keys(dataDocentes).map(hashKey => ({
                        ...dataDocentes[hashKey],
                        hashId: hashKey
                    }));
                    setDocentesListFull(fullList);

                    // Estadísticas por programa (dinámico)
                    const statsMap = { SST: { docentes: 0, cursos: 0 }, AP: { docentes: 0, cursos: 0 }, SN: { docentes: 0, cursos: 0 }, P500: { docentes: 0, cursos: 0 }, VOC: { docentes: 0, cursos: 0 } };
                    fullList.forEach(d => {
                        const prog = d.targetProgram || 'SST';
                        if (!statsMap[prog]) statsMap[prog] = { docentes: 0, cursos: 0 };
                        statsMap[prog].docentes++;
                        statsMap[prog].cursos += (d.cursos ? d.cursos.length : 0);
                    });
                    setProgramStats(statsMap);
                } else if (isMounted) {
                    setDocentesList([]);
                    setDocentesListFull([]);
                }

                // ── Analytics ───────────────────────────────────────────────
                const statsSnap = await get(ref(db, 'analytics/daily_docente'));
                const dataStats = statsSnap.val();
                if (dataStats && isMounted) {
                    setFullAnalytics(dataStats);
                    const formatted = Object.keys(dataStats).slice(-10).map(dateStr => {
                        const [yyyy, mm, dd] = dateStr.split('-');
                        return { name: `${dd}/${mm}`, consultas: dataStats[dateStr] };
                    });
                    setAnalyticsData(formatted);
                }

                // ── Events ─────────────────────────────────────────────────
                const eventsSnap = await get(ref(db, 'analytics/events_docente'));
                const eventsRaw = eventsSnap.val();
                if (eventsRaw && isMounted) setEventsData(eventsRaw);

                // ── Anuncio global (compartido con portal estudiante) ────────
                const anuncioSnap = await get(ref(db, 'config/anuncio'));
                const dataConfig = anuncioSnap.val();
                if (dataConfig && isMounted) {
                    setAnuncioData({
                        texto: dataConfig.texto || '',
                        inicio: dataConfig.inicio || '',
                        fin: dataConfig.fin || '',
                        url: dataConfig.url || '',
                        mantenimiento: Boolean(dataConfig.mantenimiento)
                    });
                }

                // ── Logs docente ────────────────────────────────────────────
                const logsSnap = await get(ref(db, 'logs_docente'));
                const dataLogs = logsSnap.val();
                if (dataLogs && isMounted) {
                    const logsArray = Object.keys(dataLogs).map(k => ({ id: k, ...dataLogs[k] }));
                    const reversed = logsArray.reverse();
                    setFullLogs(reversed);
                    setLogs(reversed.slice(0, 100));
                }

                // ── Tickets CRM (compartido) ────────────────────────────────
                const ticketsSnap = await get(ref(db, 'errores'));
                const dataTickets = ticketsSnap.val();
                if (dataTickets && isMounted) {
                    const arr = Object.keys(dataTickets).map(k => ({ id: k, ...dataTickets[k] }));
                    arr.sort((a, b) => new Date(b.fecha_creacion || b.timestamp || 0) - new Date(a.fecha_creacion || a.timestamp || 0));
                    setTickets(arr);
                }

                // ── Admin Roles (compartido) ────────────────────────────────
                const rolesSnap = await get(ref(db, 'config/administradores'));
                const rolesData = rolesSnap.val();
                if (rolesData && isMounted) setAdminRoles(rolesData);

            } catch (err) {
                if (isMounted) console.error('Error fetching admin data (docente):', err);
            } finally {
                if (isMounted) setLoadingDocentes(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [refreshCount]);

    return {
        docentesList,
        docentesListFull,
        loadingDocentes,
        analyticsData,
        anuncioData,
        logs,
        fullLogs,
        fullAnalytics,
        eventsData,
        programStats,
        adminRoles,
        tickets,
        refetchData
    };
};
