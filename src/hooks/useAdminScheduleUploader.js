import { useState } from 'react';
import * as XLSX from 'xlsx';
import { db, ref, update } from '../services/firebase';

export const useAdminScheduleUploader = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const parseScheduleCell = (text) => {
        if (!text || typeof text !== 'string' || text.trim() === '-' || text.trim() === '.') return null;

        const dayMatch = text.match(/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i);
        const linkMatch = text.match(/https?:\/\/[^\s]+/i);
        const timeMatch = text.match(/(\d+\s*[Aa]\s*\d+)/i) || text.match(/(\d+:\d+\s*[AaPp][Mm])/i);
        
        // Extraer Sala/ID si existe
        const idMatch = text.match(/ID\s*-\s*(\d+)/i) || text.match(/Sala\s+([^-\n]+)/i);

        return {
            raw: text.trim(),
            dia: dayMatch ? dayMatch[0].charAt(0).toUpperCase() + dayMatch[0].slice(1).toLowerCase() : 'Programado',
            hora: timeMatch ? timeMatch[0].toUpperCase() : 'Ver detalle',
            link: linkMatch ? linkMatch[0] : null,
            ubicacion: idMatch ? idMatch[0] : 'Consultar'
        };
    };

    const handleScheduleUpload = async (event, targetProgram) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadResult('Iniciando lectura de horarios...');

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (jsonData.length === 0) {
                setUploadResult('❌ El archivo está vacío o tiene un formato no válido.');
                setUploading(false);
                return;
            }

            const updates = {};
            let count = 0;

            jsonData.forEach((row) => {
                // Normalizar nombres de columnas para ser tolerante a variaciones
                const cleanRow = {};
                Object.keys(row).forEach(key => {
                    cleanRow[key.trim().toUpperCase()] = row[key];
                });

                const asignatura = String(cleanRow['ASIGNATURA'] || cleanRow['ASIGNATURAS'] || '').trim();
                const grupoRaw = String(cleanRow['GRUPO'] || '').trim();
                const bloque = String(row['AA'] || cleanRow['BLOQUE'] || '').trim(); // Columna AA o Bloque
                
                if (!asignatura || !grupoRaw) return;

                // Extraer el número del grupo (ej: de "1" o "G1")
                const grupoMatch = grupoRaw.match(/\d+/);
                const grupoId = grupoMatch ? `G${grupoMatch[0]}` : grupoRaw.toUpperCase();

                const semanas = {};
                // Buscamos columnas que empiecen por "SEMANA"
                Object.keys(cleanRow).forEach(key => {
                    if (key.startsWith('SEMANA')) {
                        const semanaNumMatch = key.match(/\d+/);
                        if (semanaNumMatch) {
                            const semId = `S${semanaNumMatch[0]}`;
                            const rawValue = cleanRow[key];
                            const parsedData = parseScheduleCell(rawValue);
                            
                            if (parsedData) {
                                // Intentar extraer la fecha específica de la celda (ej: "14 / marzo")
                                const dateMatch = rawValue.match(/\/\s*(\d+\s*\/\s*[a-z]+)/i);
                                if (dateMatch) {
                                    parsedData.fecha = dateMatch[1].replace(/\//g, '').trim();
                                }
                                semanas[semId] = parsedData;
                            }
                        }
                    }
                });

                if (Object.keys(semanas).length > 0) {
                    const path = `horarios/${targetProgram}/${grupoId}/${asignatura.replace(/[.#$[\]]/g, "_")}`;
                    updates[path] = {
                        asignatura,
                        grupo: grupoId,
                        bloque: bloque || 'Bloque 1', // Default si no existe
                        semanas,
                        lastUpdate: new Date().toISOString()
                    };
                    count++;
                }
            });

            if (Object.keys(updates).length > 0) {
                await update(ref(db), updates);
                setUploadResult(`✅ ¡Éxito! Se han sincronizado los horarios de ${count} asignaturas para ${targetProgram}.`);
            } else {
                setUploadResult('⚠️ No se encontraron horarios válidos en el archivo. Verifica las columnas "Asignatura", "Grupo" y "Semana 1...".');
            }

        } catch (error) {
            console.error('Error uploading schedule:', error);
            setUploadResult(`❌ Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        uploadResult,
        handleScheduleUpload
    };
};
