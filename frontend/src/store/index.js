// Tienda principal de Vuex
import Vue from 'vue';
import Vuex from 'vuex';

// Importar módulos
import auth from './modules/auth';
import app from './modules/app';

Vue.use(Vuex);

// Crear tienda
const store = new Vuex.Store({
  modules: {
    auth,
    app
  },
  // Estado global, si es necesario
  state: {
    // Estado global aquí
  },
  // Mutaciones globales, si es necesario
  mutations: {
    // Mutaciones globales aquí
  },
  // Acciones globales, si es necesario
  actions: {
    // Acciones globales aquí
  },
  // Getters globales, si es necesario
  getters: {
    // Getters globales aquí
  }
});

export default store;