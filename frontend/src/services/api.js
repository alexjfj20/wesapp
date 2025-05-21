/**
 * Servicio de API centralizada para la aplicación
 */
import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

// Crear instancia de axios con configuración por defecto
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor para añadir el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si hay error 401, podría cerrar sesión automáticamente
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o no autorizada');
      // Store podría manejar el logout: store.dispatch('auth/logout');
    }
    
    // Log del error para depuración
    console.error('API Error:', error.response || error.message || error);
    
    return Promise.reject(error);
  }
);

export default api;