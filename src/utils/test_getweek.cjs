// Original getter
const getWeekOriginal = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

// New getter
const getWeekNew = (d) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};


const d1 = new Date(2026, 1, 28, 9, 0, 0); // Feb 28, 2026
const d2 = new Date(2026, 2, 7, 9, 0, 0); // Mar 7, 2026

console.log("Original Feb 28:", getWeekOriginal(d1));
console.log("Original Mar 7:", getWeekOriginal(d2));

console.log("New Feb 28:", getWeekNew(d1));
console.log("New Mar 7:", getWeekNew(d2));

