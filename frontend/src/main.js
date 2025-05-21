// Archivo de entrada principal de Vue
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';

// Importar estilos globales
import './assets/styles/main.css';

// Importar servicios
import syncService, { initSyncService } from './services/sync'; // Corregido: importación desde el archivo correcto
import systemService from './services/systemService';
import api from './services/api';

// Configuración global
Vue.config.productionTip = false;

// Añadir servicios a Vue para acceso global
Vue.prototype.$syncService = syncService;
Vue.prototype.$systemService = systemService;
Vue.prototype.$api = api;
Vue.prototype.$initSyncService = initSyncService; // Añadimos la función directamente

// Crear instancia de Vue
const app = new Vue({
  router,
  store,
  render: h => h(App),
  mounted() {
    console.log('✅ Aplicación montada correctamente');
  }
}).$mount('#app');

// Exponer instancia para debugging
if (process.env.NODE_ENV === 'development') {
  window.app = app;
}