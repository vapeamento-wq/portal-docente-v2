// ─── UTILIDADES GENERALES — PORTAL DOCENTE ───────────────────────────────────
const URL_SCRIPT_LOGS = import.meta.env.VITE_LOGS_SCRIPT_URL || '';

/**
 * Envía un log de consulta al script de Google Sheets.
 */
export const registrarLog = (documento, accion) => {
  if (!URL_SCRIPT_LOGS) return;
  try {
    const now     = new Date();
    const dateStr = isNaN(now.getTime()) ? 'Fecha inválida' : now.toLocaleString('es-CO');
    fetch(URL_SCRIPT_LOGS, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fecha: dateStr, doc: documento, estado: `[DOCENTE] ${accion}` }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error en registrarLog:', e);
  }
};

/**
 * Genera un hash SHA-256 del número de documento para usarlo como clave anónima en Firebase.
 */
export const hashDocumento = async (doc) => {
  const encoder = new TextEncoder();
  const data    = encoder.encode(String(doc).trim());
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
};
