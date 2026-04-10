import { useState } from 'react';
import * as XLSX from 'xlsx';
import { db, ref, set, get, update, child } from '../services/firebase';
import { hashDocumento } from '../utils/helpers';

// ─── useAdminUploader — Portal Docente ───────────────────────────────────────
// Sube el Excel de docentes al nodo 'docentes' de Firebase.
export const useAdminUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const processExcel = async (e, targetProgram) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    setLogs([]);
    addLog(`Iniciando carga de docentes...`);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) throw new Error('El archivo Excel está vacío.');
      addLog(`Procesando ${rows.length} registros de docentes...`);

      const cleanedData = rows.map(row => {
        const cleanRow = {};
        Object.keys(row).forEach(key => { cleanRow[String(key).trim().toUpperCase()] = row[key]; });
        return cleanRow;
      });

      addLog('Calculando identificadores de seguridad...');
      const toUpload = {};

      const hashPromises = cleanedData.map(async (cleanRow) => {
        const docKey = Object.keys(cleanRow).find(k => k.startsWith('DOC') || k.startsWith('IDENT') || k === 'ID' || k === 'CEDULA');
        const rawId = String(cleanRow['DOCUMENTO'] || cleanRow['CEDULA'] || cleanRow['IDENTIFICACION'] || cleanRow['NUM DOC'] || cleanRow['ID'] || (docKey ? cleanRow[docKey] : '')).trim();
        const nomKey = Object.keys(cleanRow).find(k => k.includes('NOMBRE') || k.includes('APELLIDO') || k.includes('DOCENTE'));
        const nombre = String(cleanRow['NOMBRES Y APELLIDOS'] || cleanRow['APELLIDOS Y NOMBRES'] || cleanRow['NOMBRE'] || cleanRow['DOCENTE'] || (nomKey ? cleanRow[nomKey] : '')).trim();

        if (!rawId || !nombre) return null;

        const correo = String(cleanRow['CORREO'] || cleanRow['EMAIL'] || cleanRow['CORREO INSTITUCIONAL'] || '').trim();
        const programa = String(cleanRow['PROGRAMA'] || '').trim();
        const codigo_programa = String(cleanRow['COD PROGRAMA'] || cleanRow['CODIGO PROGRAMA'] || '').trim();
        const grupo = String(cleanRow['GRUPO'] || cleanRow['GRUPO DOCENTE'] || cleanRow['GR'] || '').trim();
        const pago = String(cleanRow['PAGO'] || cleanRow['ESTADO PAGO'] || cleanRow['ESTADO'] || cleanRow['PAGADO'] || '').trim().toUpperCase();
        const vinculacion = String(cleanRow['VINCULACION'] || cleanRow['TIPO VINCULACION'] || cleanRow['TIPO'] || '').trim();

        const hash = await hashDocumento(rawId);
        return {
          hash,
          data: {
            idReal: rawId,
            nombre,
            correo: correo || '',
            programa: programa || '',
            codigo_programa: codigo_programa || '',
            grupo: grupo || '',
            pago: pago || 'NO',
            vinculacion: vinculacion || '',
            targetProgram: targetProgram || 'SST',
            hashId: hash,
            lastUpdate: new Date().toISOString(),
          }
        };
      });

      const results = await Promise.all(hashPromises);
      results.forEach(res => { if (res) toUpload[res.hash] = res.data; });

      addLog(`Sincronizando ${Object.keys(toUpload).length} docentes con Firebase...`);
      await update(ref(db, 'docentes'), toUpload);

      addLog('✅ Sincronización completada con éxito.');
      setUploading(false);
      return true;
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      console.error(error);
      setUploading(false);
      return false;
    }
  };

  const clearDatabase = async (targetProgram) => {
    if (!window.confirm(`¿Borrar TODOS los docentes${targetProgram ? ` de ${targetProgram}` : ''}?`)) return;
    try {
      setUploading(true);
      const snapshot = await get(child(ref(db), 'docentes'));
      if (snapshot.exists()) {
        const updates = {};
        const docentes = snapshot.val();
        Object.keys(docentes).forEach(key => {
          if (!targetProgram || docentes[key].targetProgram === targetProgram) {
            updates[key] = null;
          }
        });
        if (Object.keys(updates).length > 0) {
          await update(ref(db, 'docentes'), updates);
          addLog(`🧹 ${Object.keys(updates).length} docentes borrados.`);
        } else {
          addLog('ℹ️ No se encontraron docentes para ese programa.');
        }
      }
      setUploading(false);
      return true;
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setUploading(false);
      return false;
    }
  };

  return {
    handleFileUpload: processExcel,
    handleDeleteDatabase: clearDatabase,
    processExcel,
    clearDatabase,
    uploading,
    logs,
    uploadResult: logs.join('\n')
  };
};
