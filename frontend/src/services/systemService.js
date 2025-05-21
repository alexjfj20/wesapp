/**
 * Servicio para verificar el estado del sistema y la conectividad
 */
import axios from 'axios';

const baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

/**
 * Obtiene el estado del sistema realizando una verificación del backend
 * @returns {Promise<Object>} Estado del sistema
 */
export async function getSystemStatus() {
  // Lista de endpoints a probar, en orden de prioridad
  const endpoints = [
    '/api/health-check',
    '/api/test/ping',
    '/ping',
    '/api/sync/status'
  ];

  // Crear instancia de axios con timeout corto para diagnóstico rápido
  const api = axios.create({
    baseURL,
    timeout: 5000
  });

  // Probar cada endpoint hasta que uno responda correctamente
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      if (response.status === 200) {
        return {
          success: true,
          message: 'Conexión establecida con el backend',
          endpoint,
          data: response.data,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log(`Endpoint ${endpoint} no disponible:`, error.message);
      // Continuar con el siguiente endpoint
    }
  }

  // Si ningún endpoint responde, devolver error
  return {
    success: false,
    message: 'No se pudo conectar con el backend',
    timestamp: new Date().toISOString()
  };
}

/**
 * Verifica si hay actualizaciones disponibles
 * @returns {Promise<Object>} Información de actualizaciones
 */
export async function checkForUpdates() {
  try {
    const api = axios.create({
      baseURL,
      timeout: 5000
    });
    const response = await api.get('/api/version');
    return response.data;
  } catch (error) {
    return {
      success: false,
      hasUpdates: false,
      error: 'No se pudo verificar actualizaciones'
    };
  }
}

// Exportar como objeto predeterminado
export default {
  getSystemStatus,
  checkForUpdates
};