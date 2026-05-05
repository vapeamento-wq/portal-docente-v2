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

export const obtenerColorLogs = (accion) => {
  if (!accion) return 'bg-gray-100 text-gray-700';
  const textoUpper = accion.toUpperCase();
  if (textoUpper.includes('ERROR') || textoUpper.includes('FALLID') || textoUpper.includes('❌')) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
  if (textoUpper.includes('ZOOM')) {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  }
  if (textoUpper.includes('EXITOS') || textoUpper.includes('✅')) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  }
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
};
