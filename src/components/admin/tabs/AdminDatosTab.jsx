import React from 'react';
import AdminUploader from '../AdminUploader';
import AdminAnnouncement from '../AdminAnnouncement';

const PROGRAM_META = {
  SST:  { label: 'SST',                  color: 'red',    emoji: '🔴' },
  AP:   { label: 'Administración Pública', color: 'blue',   emoji: '🔵' },
  SN:   { label: 'Semestre Nivelación',   color: 'purple', emoji: '🟣' },
  P500: { label: 'Programa 500×500',      color: 'amber',  emoji: '🟡' },
  VOC:  { label: 'Vocacional',            color: 'teal',   emoji: '🎓' },
};

const COLOR_CLASSES = {
  red:    { card: 'bg-red-50/60 dark:bg-red-900/10 border-red-100 dark:border-red-900/30', title: 'text-red-800 dark:text-red-400', val: 'text-red-600 dark:text-red-300' },
  blue:   { card: 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30', title: 'text-blue-800 dark:text-blue-400', val: 'text-blue-600 dark:text-blue-300' },
  purple: { card: 'bg-purple-50/60 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30', title: 'text-purple-800 dark:text-purple-400', val: 'text-purple-600 dark:text-purple-300' },
  amber:  { card: 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30', title: 'text-amber-800 dark:text-amber-400', val: 'text-amber-600 dark:text-amber-300' },
  teal:   { card: 'bg-teal-50/60 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30', title: 'text-teal-800 dark:text-teal-400', val: 'text-teal-600 dark:text-teal-300' },
};

const AdminDatosTab = ({ uploading, uploadResult, onFileUpload, onDelete, stats, anuncioData }) => (
  <div className="flex flex-col gap-6 fade-in-up pt-4">
    {/* Estadísticas por programa */}
    {stats && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(PROGRAM_META).map(([key, meta]) => {
          const c = COLOR_CLASSES[meta.color];
          const s = stats[key] || { docentes: 0, cursos: 0 };
          return (
            <div key={key} className={`${c.card} border rounded-2xl p-4`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-1 ${c.title}`}>
                {meta.emoji} {meta.label}
              </p>
              <p className={`text-2xl font-black ${c.val}`}>{s.docentes}</p>
              <p className="text-[10px] text-gray-400 mt-1">📚 {s.cursos} Cursos</p>
            </div>
          );
        })}
      </div>
    )}

    <AdminUploader
      uploading={uploading}
      uploadResult={uploadResult}
      onFileUpload={onFileUpload}
      onDelete={onDelete}
    />

    <AdminAnnouncement anuncioData={anuncioData} />
  </div>
);

export default AdminDatosTab;
