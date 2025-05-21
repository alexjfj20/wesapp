// Módulo de configuración de la aplicación para Vuex

// Estado inicial
const state = {
  darkMode: false,
  sidebarCollapsed: false,
  loading: false,
  notifications: [],
  appConfig: {
    appName: 'WebSAP',
    version: '1.0.0'
  }
};

// Getters
const getters = {
  isDarkMode: state => state.darkMode,
  isSidebarCollapsed: state => state.sidebarCollapsed,
  appName: state => state.appConfig.appName,
  appVersion: state => state.appConfig.version
};

// Acciones
const actions = {
  /**
   * Establecer modo oscuro
   * @param {Object} context - Contexto de Vuex
   * @param {Boolean} isDark - Si el modo oscuro está activado
   */
  setDarkMode({ commit }, isDark) {
    // Guardar en localStorage para persistencia
    localStorage.setItem('darkMode', isDark);
    
    // Actualizar estado
    commit('SET_DARK_MODE', isDark);
  },
  
  /**
   * Cambiar modo oscuro (toggle)
   * @param {Object} context - Contexto de Vuex
   */
  toggleDarkMode({ commit, state }) {
    const newDarkMode = !state.darkMode;
    
    // Guardar en localStorage
    localStorage.setItem('darkMode', newDarkMode);
    
    // Actualizar estado
    commit('SET_DARK_MODE', newDarkMode);
  },
  
  /**
   * Establecer estado de la barra lateral
   * @param {Object} context - Contexto de Vuex
   * @param {Boolean} isCollapsed - Si la barra lateral está colapsada
   */
  setSidebarState({ commit }, isCollapsed) {
    commit('SET_SIDEBAR_STATE', isCollapsed);
  },
  
  /**
   * Cambiar estado de la barra lateral (toggle)
   * @param {Object} context - Contexto de Vuex
   */
  toggleSidebar({ commit, state }) {
    commit('SET_SIDEBAR_STATE', !state.sidebarCollapsed);
  },
  
  /**
   * Añadir notificación
   * @param {Object} context - Contexto de Vuex
   * @param {Object} notification - Datos de la notificación
   */
  addNotification({ commit }, notification) {
    const id = Date.now().toString();
    
    const notificationWithDefaults = {
      id,
      type: notification.type || 'info',
      message: notification.message || '',
      title: notification.title || '',
      timeout: notification.timeout || 5000,
      ...notification
    };
    
    commit('ADD_NOTIFICATION', notificationWithDefaults);
    
    // Auto-eliminar después del timeout si no es persistente
    if (notificationWithDefaults.timeout > 0) {
      setTimeout(() => {
        commit('REMOVE_NOTIFICATION', id);
      }, notificationWithDefaults.timeout);
    }
  },
  
  /**
   * Eliminar notificación por ID
   * @param {Object} context - Contexto de Vuex
   * @param {String} id - ID de la notificación
   */
  removeNotification({ commit }, id) {
    commit('REMOVE_NOTIFICATION', id);
  },
  
  /**
   * Cargar configuración de la aplicación
   * @param {Object} context - Contexto de Vuex
   */
  loadAppConfig({ commit }) {
    // Aquí podríamos cargar configuración desde API
    // Por ahora, usamos valores predeterminados
    const config = {
      appName: 'WebSAP',
      version: '1.0.0'
    };
    
    commit('SET_APP_CONFIG', config);
  }
};

// Mutaciones
const mutations = {
  SET_DARK_MODE(state, isDark) {
    state.darkMode = isDark;
  },
  
  SET_SIDEBAR_STATE(state, isCollapsed) {
    state.sidebarCollapsed = isCollapsed;
  },
  
  SET_LOADING(state, isLoading) {
    state.loading = isLoading;
  },
  
  ADD_NOTIFICATION(state, notification) {
    state.notifications.push(notification);
  },
  
  REMOVE_NOTIFICATION(state, id) {
    state.notifications = state.notifications.filter(n => n.id !== id);
  },
  
  CLEAR_NOTIFICATIONS(state) {
    state.notifications = [];
  },
  
  SET_APP_CONFIG(state, config) {
    state.appConfig = { ...state.appConfig, ...config };
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};