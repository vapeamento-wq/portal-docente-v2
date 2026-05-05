import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registrarLog } from '../utils/helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getSaludo = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

/**
 * Procesa el array crudo de semanas de un curso y devuelve objetos enriquecidos.
 */
export const procesarCursos = (cursos = []) =>
  cursos.map(curso => {
    const semanas = [];
    
    // Normalizamos la entrada de semanas (puede ser semanasRaw array o semanas object)
    let rawSource = [];
    if (Array.isArray(curso.semanasRaw)) {
      rawSource = curso.semanasRaw;
    } else if (curso.semanas && typeof curso.semanas === 'object') {
      // Si es un objeto (S1, S2...), lo convertimos a un array ordenado de 16 posiciones
      rawSource = new Array(16).fill(null);
      Object.keys(curso.semanas).forEach(key => {
        const match = key.match(/\d+/);
        if (match) {
          const idx = parseInt(match[0], 10) - 1;
          if (idx >= 0 && idx < 16) {
            rawSource[idx] = curso.semanas[key].raw || curso.semanas[key];
          }
        }
      });
    }

    rawSource.forEach((item, i) => {
      if (i >= 16) return;
      const texto = typeof item === 'string' ? item : (item?.raw || '');
      if (!texto || texto.length < 2 || texto.toLowerCase().includes('pendiente')) return;

      const textoUpper = texto.toUpperCase();
      let tipo = 'ZOOM';
      let displayTexto = '';
      let ubicacion = '';
      let finalLink = null;
      let zoomId = null;
      let esIndependiente = false;

      if (textoUpper.includes('TRABAJO INDEPEN') || textoUpper.includes('TRABAJO AUTONOMO')) {
        tipo = 'INDEPENDIENTE';
        displayTexto = 'Trabajo Independiente';
        ubicacion = 'Estudio Autónomo';
        esIndependiente = true;
      } else if (textoUpper.includes('PRESENCIAL') || textoUpper.includes('CAMPUS')) {
        tipo = 'PRESENCIAL';
        displayTexto = 'Campus Principal — Presencial';
        ubicacion = texto.includes('Salón') || texto.includes('Aula') ? texto : 'Sede Principal';
      } else {
        const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
        zoomId = idMatch ? idMatch[1] : null;
        if (zoomId) {
          finalLink = `https://zoom.us/j/${zoomId}`;
        } else {
          const linkMatch = texto.match(/https?:\/\/[^\s,]+/);
          if (linkMatch) {
            let clean = linkMatch[0];
            if (clean.includes('-USUARIO')) clean = clean.split('-USUARIO')[0];
            finalLink = clean;
          }
        }
      }

      const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i);
      const horaDisplay = esIndependiente ? 'Todo el día' : (horaMatch ? horaMatch[0] : 'Programada');

      const partes = texto.split('-');
      let fechaDisplay = (partes[0] || `Semana ${i + 1}`)
        .replace(/^202[0-9]\s*\/\s*/, '')
        .replace(/\s*\/\s*/g, '/');

      semanas.push({ num: i + 1, fecha: fechaDisplay, hora: horaDisplay, tipo, displayTexto, ubicacion, zoomId, zoomLink: finalLink });
    });
    return { ...curso, semanas };
  });

// ─── Badge 500x500 ────────────────────────────────────────────────────────────
const P500Badge = ({ codigoPrograma }) =>
  codigoPrograma === 'P500' ? (
    <span className="inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-cyan-500/30 tracking-wide">
      ⭐ 500 X 500
    </span>
  ) : null;

// ─── Tipo Badge ───────────────────────────────────────────────────────────────
const TipoBadge = ({ tipo }) => {
  const cfg = {
    ZOOM:         { label: '🎥 Zoom',        cls: 'bg-blue-500/20  text-blue-300  border-blue-500/30' },
    PRESENCIAL:   { label: '🏫 Presencial',  cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
    INDEPENDIENTE:{ label: '🏠 Independiente',cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  }[tipo] || { label: tipo, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.cls} tracking-wide whitespace-nowrap`}>
      {cfg.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCENTE CARD
// ═══════════════════════════════════════════════════════════════════════════════
const DocenteCard = ({ docente, onReset }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const cursos = docente?.cursos || [];
  const cursoActivo = cursos[selectedIdx] || null;

  if (!docente) return null;

  const inicial = (docente.nombre || '?').charAt(0).toUpperCase();

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8"
    >
      {/* ── Layout principal ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── SIDEBAR — Perfil + Cursos ─────────────────────────────────── */}
        <aside className="lg:w-[300px] shrink-0">
          <div className="bg-[#1E293B] rounded-3xl p-6 border border-slate-700/50 shadow-xl sticky top-6">

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#db9b32] flex items-center justify-center text-[#003366] font-black text-3xl shadow-lg border-4 border-[#003366] mb-3">
                {inicial}
              </div>
              <h3 className="text-white font-black text-lg text-center leading-tight">{docente.nombre}</h3>
              <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
                <span className="text-slate-400 text-xs bg-slate-800 px-3 py-1 rounded-full font-mono">
                  CC {docente.idReal || ''}
                </span>
                {docente.codigo_programa && <P500Badge codigoPrograma={docente.codigo_programa} />}
              </div>
              <p className="text-slate-400 text-xs mt-2 text-center leading-relaxed">
                {getSaludo()}, profesor/a 👋
              </p>
            </div>

            {/* Lista de cursos */}
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
                Mis Cursos ({cursos.length})
              </p>
              {cursos.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border transition-all cursor-pointer font-medium text-sm ${
                    selectedIdx === i
                      ? 'bg-[#003366] border-blue-700 text-white shadow-lg'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="font-bold leading-tight text-[13px] mb-1 line-clamp-2">{c.materia}</div>
                  <div className={`text-[10px] font-black uppercase tracking-wider ${selectedIdx === i ? 'text-[#db9b32]' : 'text-slate-500'}`}>
                    {c.bloque || c.grupo || ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────── */}
        <section className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Hero Card del curso activo */}
          {cursoActivo && (
            <div className="relative bg-gradient-to-br from-[#003366] to-[#004080] rounded-3xl p-7 md:p-10 overflow-hidden shadow-2xl border border-blue-900/50">
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#db9b32]/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10">
                <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-2">Curso Activo</p>
                <h2 className="text-white font-black text-2xl md:text-3xl leading-tight mb-2">
                  {cursoActivo.materia}
                </h2>
                {cursoActivo.grupo && (
                  <p className="text-blue-200 text-sm font-medium mb-4">{cursoActivo.grupo}</p>
                )}

                <div className="flex flex-wrap gap-3 mt-4 bg-black/25 rounded-2xl px-5 py-3 backdrop-blur">
                  {cursoActivo.fInicio && (
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="text-[#db9b32]">📅</span>
                      <span>Inicio: <strong>{cursoActivo.fInicio}</strong></span>
                    </div>
                  )}
                  {cursoActivo.fFin && (
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="text-[#db9b32]">🏁</span>
                      <span>Fin: <strong>{cursoActivo.fFin}</strong></span>
                    </div>
                  )}
                  {cursoActivo.semanas && (
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="text-[#db9b32]">📋</span>
                      <span>{cursoActivo.semanas.length} semanas</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline de semanas */}
          {cursoActivo && (
            <div className="bg-[#1E293B] rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-700/50">
                <h3 className="text-white font-black text-lg">📅 Cronograma de Actividades</h3>
                <p className="text-slate-400 text-xs mt-1">Programación semanal — {cursoActivo.materia}</p>
              </div>

              {cursoActivo.semanas && cursoActivo.semanas.length > 0 ? (
                <div className="divide-y divide-slate-700/30">
                  {cursoActivo.semanas.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-5 px-6 py-5 hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Número de semana */}
                      <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center">
                        <span className="text-slate-500 text-[8px] font-black uppercase tracking-wider">SEM</span>
                        <span className="text-white font-black text-lg leading-none">{s.num}</span>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-white font-bold text-sm truncate">{s.fecha}</p>
                          <TipoBadge tipo={s.tipo} />
                        </div>

                        {s.tipo === 'INDEPENDIENTE' ? (
                          <p className="text-slate-400 text-xs">🏠 {s.displayTexto} — {s.hora}</p>
                        ) : s.tipo === 'PRESENCIAL' ? (
                          <p className="text-slate-400 text-xs">🏫 {s.ubicacion} · ⏰ {s.hora}</p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-slate-400 text-xs">⏰ {s.hora}</span>
                            {s.zoomLink && (
                              <a
                                href={s.zoomLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}
                                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-md"
                              >
                                🎥 Unirse a Zoom
                              </a>
                            )}
                            {s.zoomId && (
                              <span className="text-slate-500 text-[10px] font-mono">ID: {s.zoomId}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-slate-500 text-sm">No hay semanas programadas para este curso.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
};

export default DocenteCard;
