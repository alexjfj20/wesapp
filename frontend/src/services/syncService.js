/**
 * Servicio para gestionar la sincronización de datos en la aplicación
 */
import axios from 'axios';

// Crear instancia de axios con configuración por defecto
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

/**
 * Inicia el servicio de sincronización
 * @returns {Promise<Object>} Estado de la sincronización
 */
export const initSyncService = async () => {
  try {
    console.log('📱 Iniciando servicio de sincronización...');
    
    // Intenta conectar con el backend
    try {
      const response = await api.get('/api/sync/status');
      return response.data;
    } catch (apiError) {
      console.warn('No se pudo conectar con el endpoint de sincronización, usando simulación', apiError);
      
      // Si falla la API, devuelve una respuesta simulada para desarrollo
      return {
        success: true,
        status: 'simulated',
        message: 'Servicio de sincronización simulado activo',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error general al iniciar servicio de sincronización:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al iniciar sincronización',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Verifica el estado actual de la sincronización
 * @returns {Promise<Object>} Estado de la sincronización
 */
export const checkSyncStatus = async () => {
  try {
    const response = await api.get('/api/sync/status');
    return response.data;
  } catch (error) {
    console.error('Error al verificar estado de sincronización:', error);
    return {
      success: false,
      status: 'error',
      message: error.message || 'Error desconocido al verificar sincronización'
    };
  }
};

// Exportar funciones individualmente y como objeto predeterminado
export default {
  initSyncService,
  checkSyncStatus
};