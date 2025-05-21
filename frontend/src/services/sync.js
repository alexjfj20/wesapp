/**
 * Servicio de sincronización para la aplicación WebSAP
 */
import axios from 'axios';

// Crear la instancia de axios para comunicación con el backend
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Inicia el servicio de sincronización
 * @returns {Promise<Object>} Estado de la sincronización
 */
export function initSyncService() {
  console.log('Iniciando servicio de sincronización');
  
  return new Promise((resolve, reject) => {
    // Intentar conectar con el endpoint de sincronización
    api.get('/api/sync/status')
      .then(response => {
        console.log('Servicio de sincronización iniciado correctamente', response.data);
        resolve(response.data);
      })
      .catch(error => {
        console.warn('Error al iniciar sincronización, usando modo offline', error);
        // Devolver una respuesta simulada para permitir funcionamiento offline
        resolve({
          success: true,
          status: 'offline',
          message: 'Modo offline activado',
          timestamp: new Date().toISOString()
        });
      });
  });
}

/**
 * Verifica el estado actual de la sincronización
 * @returns {Promise<Object>} Estado de la sincronización
 */
export function checkSyncStatus() {
  return api.get('/api/sync/status')
    .then(response => response.data)
    .catch(error => ({
      success: false,
      status: 'error',
      message: error.message || 'Error al verificar estado de sincronización',
      timestamp: new Date().toISOString()
    }));
}

/**
 * Exportación por defecto del módulo para compatibilidad
 */
export default {
  initSyncService,
  checkSyncStatus
};