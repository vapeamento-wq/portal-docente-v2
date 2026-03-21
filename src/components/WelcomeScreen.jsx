import React from 'react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ fechaEspanol, onAdminAccess }) => {
    const frasesMotivacionales = [
        "¡Tu labor transforma vidas hoy!",
        "Enseñar es dejar una huella en el futuro.",
        "Cada clase es una oportunidad para inspirar.",
        "El conocimiento es el arma más poderosa para cambiar el mundo.",
        "La educación es el encendido de una llama, no el llenado de un recipiente.",
        "Un gran maestro toma la mano, abre la mente y toca el corazón.",
        "La enseñanza es el acto más grande de optimismo.",
        "Donde hay un maestro, hay esperanza.",
        "Tu pasión por la enseñanza es el motor del aprendizaje.",
        "El éxito de tus estudiantes es tu mayor legado.",
        "Educar no es fabricar adultos conforme a un modelo, sino liberar en cada hombre lo que le impide ser él mismo.",
        "La enseñanza que deja huella no es la que se hace de cabeza a cabeza, sino de corazón a corazón.",
        "Aprender sin pensar es tiempo perdido; pensar sin aprender es peligroso.",
        "La tarea del educador moderno no es talar selvas, sino regar desiertos.",
        "Lo que el maestro es, es más importante que lo que enseña.",
        "El arte supremo del maestro es despertar la alegría en la expresión creativa y el conocimiento.",
        "Si tienes que poner a alguien en un pedestal, pon a los maestros. Son los héroes de la sociedad.",
        "Los maestros inspiran, motivan y cambian el mundo.",
        "Un maestro afecta la eternidad; nunca puede decir dónde termina su influencia.",
        "La educación es el pasaporte hacia el futuro, el mañana pertenece a quienes se preparan para él hoy.",
        "El maestro mediocre dice. El buen maestro explica. El maestro superior demuestra. El gran maestro inspira.",
        "Enseñar es aprender dos veces.",
        "La educación es lo que sobrevive cuando lo que se ha aprendido se ha olvidado.",
        "Tu trabajo es la base sobre la cual se construye el futuro de nuestra sociedad.",
        "Gracias por tu paciencia, tu entrega y tu inalcanzable fe en tus alumnos.",
        "Ser docente es creer en el potencial de cada ser humano.",
        "La semilla del conocimiento que siembras hoy dará frutos maravillosos mañana.",
        "Tu guía es la brújula que ayuda a los estudiantes a encontrar su propio camino.",
        "La excelencia académica comienza con la pasión del maestro.",
        "Eres el arquitecto de los sueños de tus estudiantes."
    ];

    // Seleccionar una frase basada en el día de la fecha para que cambie cada 24h
    const ahora = new Date();
    const diaDelMes = ahora.getDate(); // 1 a 31
    const fraseDelDia = frasesMotivacionales[(diaDelMes - 1) % frasesMotivacionales.length];

    return (
        <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="col-span-1 md:col-span-2 text-center py-24 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg rounded-[20px] transition-colors duration-300 relative overflow-hidden"
        >
            <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-10 relative shadow-2xl mx-auto max-w-5xl border border-white/10">
                <img
                    src="/cabana_lago.jpg"
                    alt="Campus Universitario"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/80 via-[#003366]/20 to-transparent flex items-end justify-center pb-6">
                    <div className="w-16 h-1 bg-[#db9b32] rounded-full opacity-80 shadow-[0_0_10px_rgba(219,155,50,0.5)]"></div>
                </div>
            </div>
            
            <p className="text-[#003366] dark:text-blue-400 italic max-w-2xl mx-auto text-2xl font-medium leading-relaxed px-6">
                "{fraseDelDia}"
            </p>

            <div className="mt-10 text-xl text-gray-800 dark:text-gray-200 font-bold capitalize">
                {fechaEspanol}
            </div>
            <div
                className="absolute bottom-5 right-5 cursor-pointer opacity-20 text-xs hover:opacity-100 transition-opacity dark:text-gray-400 text-[#1A1A1A]"
                onClick={onAdminAccess}
            >
                🔒 Acceso Administrativo
            </div>
        </motion.div>
    );
};

export default WelcomeScreen;
