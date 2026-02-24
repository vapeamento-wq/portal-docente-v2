const MESES = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const parseCourseDate = (fechaStr, horaStr) => {
    const parts = fechaStr.split('/').map(p => p.trim());
    let year = 2026;
    let day = 1;
    let month = 0;

    parts.forEach(p => {
      const num = parseInt(p);
      if (!isNaN(num)) {
        if (num > 2000) {
          year = num;
        } else if (num >= 1 && num <= 31) {
          day = num;
        }
      } else {
        const m = MESES[p.toLowerCase()];
        if (m !== undefined) {
          month = m;
        }
      }
    });
    return new Date(year, month, day, 9);
};

const hoy = new Date("2026-02-24T03:57:12.925Z");

const getWeek = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

const procesarCursos = (cursos) => {
  return cursos.map(curso => {
    const semanasProcesadas = [];
    const semanasRaw = curso.semanasRaw || [];

    semanasRaw.forEach((texto, i) => {
      const partes = texto.split('-');
      let fechaRaw = partes[0].trim();
      let horaRaw = partes[1] ? partes[1].trim() : "00 a 00";

      const fechaObj = parseCourseDate(fechaRaw, horaRaw);

      let status = 'future';
      if (fechaObj) {
        const currentWeek = getWeek(hoy);
        const courseWeek = getWeek(fechaObj);

        const currentYear = hoy.getFullYear();
        const courseYear = fechaObj.getFullYear();

        if (isNaN(courseWeek)) {
          status = 'past';
        } else if (courseYear < currentYear) {
          status = 'past';
        } else if (courseYear > currentYear) {
          status = 'future';
        } else {
          // Same year, check weeks
          if (courseWeek < currentWeek) {
            status = 'past';
          } else if (courseWeek > currentWeek) {
            status = 'future';
          } else {
            // El usuario solicitó que "la semana que estamos corriendo" se vea verde (present) en su totalidad.
            status = 'present';
          }
        }
        console.log(`Week ${i+1}: Date=${fechaObj.toISOString()}, courseWeek=${courseWeek}, currentWeek=${currentWeek}, status=${status}`);
      }
    });
  });
};

procesarCursos([{
    semanasRaw: [
        'sábado / 21 / febrero-7 A 9- TRABAJO INDEPENDIENTE',
        'sábado / 28 / febrero-7 A 9- ID 123456789',
        'sábado / 07 / marzo-7 A 9- TRABAJO INDEPENDIENTE'
    ]
}]);
