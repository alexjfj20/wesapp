<!-- App.vue - Componente raíz de la aplicación -->
<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- Contenedor principal -->
    <router-view />

    <!-- Componente de notificaciones -->
    <notifications />

    <!-- Modal de error global -->
    <div v-if="showErrorModal" class="error-modal">
      <div class="error-content">
        <h3>Error</h3>
        <p>{{ errorMessage }}</p>
        <button @click="closeErrorModal">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script>
// Importaciones necesarias
import { mapState, mapActions } from 'vuex';
import Notifications from './components/common/Notifications.vue';
import { initSyncService } from './services/sync'; // Corregido: importación desde el archivo correcto
import systemService from './services/systemService';

export default {
  name: 'App',
  components: {
    Notifications
  },
  data() {
    return {
      showErrorModal: false,
      errorMessage: '',
      systemStatus: {
        loading: true,
        online: false,
        lastCheck: null
      }
    };
  },
  computed: {
    ...mapState({
      isDarkMode: state => state.app.darkMode,
      isAuthenticated: state => state.auth.isAuthenticated,
      currentUser: state => state.auth.user
    })
  },  watch: {
    $route(to) {
      // Actualiza el título de la página cuando cambia la ruta
      const baseTitle = 'WebSAP';
      const pageTitle = to.meta.title || 'Página';
      document.title = `${baseTitle} - ${pageTitle}`;
      
      // Verificar autenticación para rutas protegidas
      if (to.meta.requiresAuth && !this.isAuthenticated) {
        console.log('Ruta protegida, redirigiendo a login');
        this.$router.push('/login');
      }
    }
  },
  created() {
    // Inicializar tema
    this.initializeTheme();
    
    // Cargar configuración inicial
    this.loadAppConfiguration();
    
    // Verificar autenticación
    this.checkAuthStatus();
  },  async mounted() {
    console.log('🚀 App montada');
    console.log('Verificando initSyncService:', typeof initSyncService === 'function' ? 'Es una función' : 'No es una función');
    
    // Verificar estado del sistema
    try {
      // Usar el servicio importado en lugar de this.$systemService
      const status = await systemService.getSystemStatus();
      this.systemStatus = {
        loading: false,
        online: status.success,
        lastCheck: new Date()
      };
      
      if (!status.success) {
        console.warn('⚠️ Sistema backend no disponible:', status.message);
      } else {
        console.log('✅ Conexión con backend establecida correctamente');
      }
    } catch (error) {
      console.error('Error al verificar estado del sistema:', error);
      this.systemStatus.loading = false;
    }
    
    // Iniciar servicio de sincronización si el usuario está autenticado
    if (this.isAuthenticated) {
      try {
        // Verificar que initSyncService sea una función antes de llamarla
        if (typeof initSyncService === 'function') {
          const syncStatus = await initSyncService();
          console.log('📱 Estado de sincronización:', syncStatus);
        } else {
          console.error('Error: initSyncService no es una función');
        }
      } catch (error) {
        console.error('Error al iniciar servicio de sincronización:', error);
        // No mostrar error al usuario, ya que no es crítico para la funcionalidad básica
      }
    }
      // Cargar recursos SVG
    this.loadSvgIcons().catch(() => {
      console.error('Error al cargar imágenes SVG, usando fallback inline');
    });
    
    console.log('✅ Aplicación montada correctamente');
  },
  methods: {
    ...mapActions({
      setDarkMode: 'app/setDarkMode',
      setUser: 'auth/setUser',
      logout: 'auth/logout'
    }),
    
    /**
     * Inicializa el tema (claro/oscuro) basado en preferencias del usuario
     */
    initializeTheme() {
      // Verificar preferencia guardada en localStorage
      const savedTheme = localStorage.getItem('darkMode');
      
      // Si hay una preferencia guardada, usarla
      if (savedTheme !== null) {
        this.setDarkMode(savedTheme === 'true');
      } else {
        // Si no hay preferencia, detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setDarkMode(prefersDark);
      }
    },
    
    /**
     * Carga la configuración inicial de la aplicación
     */
    loadAppConfiguration() {
      // Aquí podría cargar configuración desde el servidor o localStorage
      // Por ahora, usamos valores predeterminados
    },
    
    /**
     * Verifica el estado de autenticación del usuario
     */
    checkAuthStatus() {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          this.setUser({ token, user });
        } catch (error) {
          console.error('Error al parsear datos de usuario:', error);
          this.logout();
        }
      }
    },
    
    /**
     * Carga iconos SVG para la aplicación
     */
    async loadSvgIcons() {
      // Aquí podría cargar SVGs desde un endpoint o archivos locales
      return Promise.resolve();
    },
    
    /**
     * Muestra un modal de error global
     */
    showError(message) {
      this.errorMessage = message;
      this.showErrorModal = true;
    },
    
    /**
     * Cierra el modal de error global
     */
    closeErrorModal() {
      this.showErrorModal = false;
      this.errorMessage = '';
    }
  }
};
</script>

<style>
#app {
  font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Dark mode styles */
#app.dark-mode {
  background-color: #121212;
  color: #f0f0f0;
}

/* Error modal styles */
.error-modal {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

/* Dark mode error modal */
.dark-mode .error-content {
  background: #333;
  color: white;
}

.error-content button {
  margin-top: 15px;
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-content button:hover {
  background: #c0392b;
}
</style>