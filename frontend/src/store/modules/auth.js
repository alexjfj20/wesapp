// Módulo de autenticación para Vuex
import api from '../../services/api';

// Estado inicial
const state = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

// Getters
const getters = {
  isAdmin: (state) => {
    return state.isAuthenticated && 
           state.user && 
           state.user.roles && 
           (state.user.roles.includes('Administrador') || 
            state.user.roles.includes('Superadministrador'));
  },
  isSuperAdmin: (state) => {
    return state.isAuthenticated && 
           state.user && 
           state.user.roles && 
           state.user.roles.includes('Superadministrador');
  },
  userRoles: (state) => {
    return state.user ? state.user.roles : [];
  }
};

// Acciones
const actions = {
  /**
   * Iniciar sesión con email y contraseña
   * @param {Object} context - Contexto de Vuex
   * @param {Object} credentials - Credenciales de inicio de sesión
   */
  async login({ commit }, credentials) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const response = await api.post('/api/auth/login', credentials);
      
      const { token, user } = response.data;
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Actualizar estado
      commit('setUser', { token, user });
      commit('setLoading', false);
      
      return { success: true, user };
    } catch (error) {
      commit('setError', error.message || 'Error al iniciar sesión');
      commit('setLoading', false);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Cerrar sesión
   * @param {Object} context - Contexto de Vuex
   */
  logout({ commit }) {
    // Eliminar datos de localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Actualizar estado
    commit('clearUser');
    
    return { success: true };
  },
  
  /**
   * Establecer usuario actual
   * @param {Object} context - Contexto de Vuex
   * @param {Object} userData - Datos del usuario
   */
  setUser({ commit }, userData) {
    commit('setUser', userData);
  },
  
  /**
   * Actualizar perfil de usuario
   * @param {Object} context - Contexto de Vuex
   * @param {Object} profileData - Datos del perfil a actualizar
   */
  async updateProfile({ commit, state }, profileData) {
    if (!state.isAuthenticated) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    
    commit('setLoading', true);
    
    try {
      const response = await api.put('/api/auth/profile', profileData);
      
      // Actualizar usuario en localStorage
      const updatedUser = { ...state.user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Actualizar estado
      commit('updateUser', updatedUser);
      commit('setLoading', false);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      commit('setError', error.message || 'Error al actualizar perfil');
      commit('setLoading', false);
      return { success: false, error: error.message };
    }
  }
};

// Mutaciones
const mutations = {
  setUser(state, { token, user }) {
    state.isAuthenticated = true;
    state.token = token;
    state.user = user;
  },
  
  updateUser(state, user) {
    state.user = { ...state.user, ...user };
  },
  
  clearUser(state) {
    state.isAuthenticated = false;
    state.token = null;
    state.user = null;
  },
  
  setLoading(state, isLoading) {
    state.loading = isLoading;
  },
  
  setError(state, error) {
    state.error = error;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};