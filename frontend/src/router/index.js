import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

// Importar componentes para las rutas
const Home = () => import(/* webpackChunkName: "home" */ '../views/Home.vue');
const Login = () => import(/* webpackChunkName: "auth" */ '../views/Login.vue');
const Register = () => import(/* webpackChunkName: "auth" */ '../views/Register.vue');
const About = () => import(/* webpackChunkName: "about" */ '../views/About.vue');

// Definición de rutas
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: 'Inicio'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: 'Iniciar Sesión',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: {
      title: 'Registrarse',
      requiresAuth: false
    }
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      title: 'Acerca de'
    }
  },
  // Ruta de error 404
  {
    path: '*',
    redirect: '/'
  }
];

// Crear instancia de router
const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

// Guard de navegación para verificar autenticación
router.beforeEach((to, from, next) => {
  // Actualizar título
  document.title = to.meta.title ? `WebSAP - ${to.meta.title}` : 'WebSAP';
  
  // Verificar si la ruta requiere autenticación
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoginRoute = to.name === 'login' || to.name === 'register';
  
  // Obtener estado de autenticación del store (si está configurado)
  const store = router.app.$store;
  const isAuthenticated = store && store.state.auth ? store.state.auth.isAuthenticated : false;
  
  console.log(`Ruta: ${to.name}, requiresAuth: ${requiresAuth}, isAuthenticated: ${isAuthenticated}`);
  
  if (requiresAuth && !isAuthenticated) {
    // Si la ruta requiere autenticación y el usuario no está autenticado, redirigir a login
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (isLoginRoute && isAuthenticated) {
    // Si el usuario ya está autenticado y va a login o registro, redirigir a inicio
    next({ name: 'home' });
  } else {
    // En cualquier otro caso, continuar
    next();
  }
});

export default router;