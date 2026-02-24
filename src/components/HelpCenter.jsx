import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpCenter = ({ onClose }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        setError('');
        try {
            // Re-using the same firebase pattern from helpers/AdminPanel
            const response = await fetch(`${import.meta.env.VITE_FIREBASE_DB_BASE_URL}/miniclips.json`);
            if (!response.ok) throw new Error('Error al cargar la galería de videos.');

            const data = await response.json();
            if (data) {
                // Firebase returns an object with random keys, we convert to array
                const videoArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort by date added (newest first)
                videoArray.sort((a, b) => b.timestamp - a.timestamp);
                setVideos(videoArray);
            } else {
                setVideos([]);
            }
        } catch (err) {
            console.error("Error fetching videos:", err);
            setError('No pudimos cargar los videos. Por favor, intenta de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-[30px] shadow-2xl flex flex-col overflow-hidden relative"
            >
                {/* Header Section */}
                <div className="flex-none p-6 sm:p-8 pb-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-[#003366] dark:text-blue-400 m-0 flex items-center gap-3 tracking-tight">
                            <span>🎬</span> Centro de Ayuda
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base font-medium">
                            Encuentra respuestas rápidas en nuestros videos (Mini-clips) paso a paso.
                        </p>
                    </div>
                    {/* Close Modal Button */}
                    <button
                        onClick={onClose}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 w-10 h-10 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer flex-shrink-0"
                        title="Cerrar Centro de Ayuda"
                    >
                        ✖
                    </button>
                </div>

                {/* Content Section: Gallery */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/50 dark:bg-slate-900/50 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#2D8CFF] rounded-full animate-spin"></div>
                            <p className="font-bold text-gray-500">Cargando galería de videos...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <p className="font-bold">{error}</p>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                            <span className="text-6xl mb-4">📭</span>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Aún no hay videos disponibles.</h3>
                            <p className="text-gray-500 dark:text-gray-400">Pronto agregaremos mini-clips de ayuda en esta sección.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {videos.map((vid) => (
                                <motion.div
                                    key={vid.id}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer group flex flex-col h-full"
                                    onClick={() => setSelectedVideo(vid)}
                                >
                                    {/* Thumbnail Placeholder Area */}
                                    <div className="h-40 bg-gray-200 dark:bg-slate-700 relative overflow-hidden flex items-center justify-center flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/50 z-20 group-hover:scale-110 group-hover:bg-white transition-all">
                                            <span className="text-xl ml-1 text-white group-hover:text-[#2D8CFF]">▶</span>
                                        </div>
                                    </div>
                                    {/* Text Info */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2 leading-tight group-hover:text-[#2D8CFF] transition-colors">
                                            {vid.title}
                                        </h3>
                                        {vid.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-auto">
                                                {vid.description}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={() => setSelectedVideo(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden relative shadow-2xl ring-1 ring-white/20"
                        >
                            <div className="absolute top-4 right-4 z-[120]">
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="bg-black/50 hover:bg-red-500/80 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors border-none cursor-pointer"
                                >
                                    ✖
                                </button>
                            </div>

                            <div className="p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-[115] pointer-events-none">
                                <h3 className="text-white font-bold text-lg m-0 pr-12 drop-shadow-md">{selectedVideo.title}</h3>
                            </div>

                            {/* Important: SharePoint iframe embedding */}
                            <div className="aspect-video w-full bg-slate-900 mt-0">
                                <iframe
                                    src={selectedVideo.iframeUrl}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allowFullScreen
                                    title={selectedVideo.title}
                                    className="w-full h-full"
                                ></iframe>
                            </div>

                            {selectedVideo.description && (
                                <div className="p-4 bg-slate-900 text-gray-300 text-sm border-t border-slate-800">
                                    <span className="opacity-70">Nota: </span> {selectedVideo.description}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default HelpCenter;
