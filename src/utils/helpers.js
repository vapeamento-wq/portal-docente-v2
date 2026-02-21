export const URL_SCRIPT_LOGS = "https://script.google.com/macros/s/AKfycbzME0D_wVP6l4AxLsZMFT4gIDJoD5LAlUhrQ1OL3Al1tAUZZvmiiF1VOlYmiUqY_DeL/exec";
export const URL_TU_EXCEL_MAESTRO = "https://docs.google.com/spreadsheets/d/1fHgj_yep0s7955EeaRpFiJeBLJX_-PLtjOFxWepoprQ/edit";
export const URL_FIREBASE_CONSOLE = "https://console.firebase.google.com/";

export const registrarLog = (documento, accion) => {
  try {
    const datosLog = {
      fecha: new Date().toLocaleString('es-CO'),
      doc: documento,
      estado: `[APP] ${accion}`
    };
    fetch(URL_SCRIPT_LOGS, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosLog)
    }).catch(err => console.log("Error enviando log:", err));
  } catch (e) { console.error("Error en registrarLog:", e); }
};

const MESES = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const parseCourseDate = (fechaStr, horaStr) => {
  try {
    // fechaStr format: "21 / febrero" (Year is handled separately or assumed current/next for logic)
    // Actually the input raw string has Year: "2026 / 21 / febrero"

    // Clean up string: "2026 / 21 / febrero" -> ["2026", "21", "febrero"]
    const parts = fechaStr.split('/').map(p => p.trim());

    let year = new Date().getFullYear();
    let day = 1;
    let month = 0;

    if (parts.length >= 3) {
      const p0 = parseInt(parts[0]);
      if (!isNaN(p0) && p0 > 2000) {
        year = p0;
        day = parseInt(parts[1]);
        month = MESES[parts[2].toLowerCase()] || 0;
      } else {
        // "sábado", "21", "febrero"
        day = parseInt(parts[1]);
        month = MESES[parts[2].toLowerCase()] || 0;
      }
    } else if (parts.length === 2) {
      day = parseInt(parts[0]);
      month = MESES[parts[1].toLowerCase()] || 0;
    }

    // Hora: "11 a 13" -> Take start hour "11"
    let hour = 9; // Default
    if (horaStr && horaStr.includes('a')) {
      const horaParts = horaStr.split('a');
      hour = parseInt(horaParts[0].trim());
    }

    return new Date(year, month, day, hour);
  } catch (e) {
    console.warn("Error parseando fecha:", fechaStr, e);
    return null;
  }
};

export const procesarCursos = (cursos) => {
  if (!cursos || !Array.isArray(cursos)) return []; // Fix white screen crash

  const hoy = new Date();

  // Reset hours to compare dates only for "Present" day, but we want "Week" granularity.
  // Strategy: If date is < today (minus 1 day buffer), it's Past.
  // If date is today, it's Present.
  // If date is future, it's Future.

  return cursos.map(curso => {
    const semanasProcesadas = [];
    const semanasRaw = curso.semanasRaw || [];

    semanasRaw.forEach((texto, i) => {
      // Basic validation
      if (i >= 16) return;
      if (!texto || texto.length < 5 || texto.startsWith("-") || texto.toLowerCase().includes("pendiente")) return;

      // --- 1. Parsing Logic ---
      const partes = texto.split('-');
      // Example part[0]: "2026 / 21 / febrero"
      let fechaRaw = partes[0].trim();

      // Extract Hour: "11 a 13" -> part[1] typically
      // But data format varies. Example: "2026 / 21 / febrero-11 a 13- ..."
      // partes[1] is usually hour range if standard format.
      let horaRaw = partes[1] ? partes[1].trim() : "00 a 00";

      // Display Strings
      let fechaDisplay = fechaRaw.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, ' / '); // "21 / febrero"
      let horaDisplay = horaRaw;

      // --- 2. Build Date Object for Logic ---
      const fechaObj = parseCourseDate(fechaRaw, horaRaw);

      // --- 3. Determine Status (Past/Present/Future) ---
      let status = 'future';
      if (fechaObj) {
        const getWeek = (d) => {
          const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
          const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
          return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
        };

        const currentWeek = getWeek(hoy);
        const courseWeek = getWeek(fechaObj);

        // Year check is also important
        const currentYear = hoy.getFullYear();
        const courseYear = fechaObj.getFullYear();

        if (courseYear < currentYear) {
          status = 'past';
        } else if (courseYear > currentYear) {
          status = 'future';
        } else {
          if (courseWeek < currentWeek) {
            status = 'past';
          } else if (courseWeek === currentWeek) {
            status = 'present';
          } else {
            status = 'future';
          }
        }
      }

      // --- 4. Content Logic (Zoom, Location, etc) ---
      let tipo = 'ZOOM';
      let displayTexto = '';
      let ubicacion = '';
      let finalLink = null;
      let zoomId = null;
      let esTrabajoIndependiente = false;
      const textoUpper = texto.toUpperCase();

      if (textoUpper.includes("TRABAJO INDEPEN") || textoUpper.includes("TRABAJO AUTONOMO")) {
        tipo = 'INDEPENDIENTE';
        displayTexto = "Trabajo Independiente";
        ubicacion = "Estudio Autónomo";
        esTrabajoIndependiente = true;
        horaDisplay = "Todo el día";
      }
      else if (textoUpper.includes("PRESENCIAL") || textoUpper.includes("CAMPUS")) {
        tipo = 'PRESENCIAL';
        displayTexto = "Campus Principal - Presencial";
        ubicacion = "Sede Principal";
        if (texto.includes("Salón") || texto.includes("Aula")) ubicacion = texto;
      }
      else {
        const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
        zoomId = idMatch ? idMatch[1] : null;
        if (zoomId) finalLink = `https://zoom.us/j/${zoomId}`;
        else {
          const linkMatch = texto.match(/https?:\/\/[^\s,]+/);
          if (linkMatch && linkMatch[0]) {
            let cleanLink = linkMatch[0];
            if (cleanLink.includes("-USUARIO")) cleanLink = cleanLink.split("-USUARIO")[0];
            finalLink = cleanLink;
          }
        }
      }



      const fechaValida = fechaObj && !isNaN(fechaObj.getTime());

      semanasProcesadas.push({
        num: i + 1,
        fecha: fechaDisplay,
        hora: horaDisplay,
        tipo: tipo,
        displayTexto: displayTexto,
        ubicacion: ubicacion,
        zoomId: zoomId,
        zoomLink: finalLink,
        status: status, // 'past', 'present', 'future'
        fechaObj: fechaValida ? fechaObj : null, // Passed for countdown logic
        fechaRaw: fechaValida ? fechaObj.toISOString() : null
      });
    });
    return { ...curso, semanas: semanasProcesadas };
  });
};

export const formatoFechaHora = (fechaActual) => {
  const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
  const fecha = fechaActual.toLocaleDateString('es-CO', opcionesFecha);
  const hora = fechaActual.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return { fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1), hora: hora };
};

export const getSaludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
};
