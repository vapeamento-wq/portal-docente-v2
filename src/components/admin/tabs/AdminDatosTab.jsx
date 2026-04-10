import React from 'react';
import AdminUploader from '../AdminUploader';
import AdminAnnouncement from '../AdminAnnouncement';

const AdminDatosTab = ({ uploading, uploadResult, onFileUpload, onDelete, stats, anuncioData }) => (
  <div className="flex flex-col gap-6 fade-in-up pt-4">
    {/* Estadísticas rápidas */}
    {stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{key}</p>
            <p className="text-2xl font-black text-[#003366] dark:text-blue-400">{val.docentes ?? val.estudiantes ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">Docentes registrados</p>
          </div>
        ))}
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
