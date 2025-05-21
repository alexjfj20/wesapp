<template>
  <div class="login">
    <div class="login-container">
      <h1>Iniciar Sesión</h1>
      
      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label for="username">Usuario o Email</label>
          <input 
            id="username"
            v-model="credentials.username"
            type="text"
            placeholder="Usuario o Email"
            required
            autocomplete="username"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password"
            v-model="credentials.password"
            type="password"
            placeholder="Contraseña"
            required
            autocomplete="current-password"
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="isLoading" class="btn-login">
            {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </div>
        
        <div class="login-links">
          <router-link to="/register">¿No tienes cuenta? Regístrate</router-link>
          <router-link to="/forgot-password">¿Olvidaste tu contraseña?</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      error: null,
      isLoading: false
    };
  },
  methods: {
    async login() {
      try {
        this.error = null;
        this.isLoading = true;
        
        // Simular llamada a API
        // En una implementación real, esto sería una llamada al backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Intentando iniciar sesión con:', this.credentials.username);
        
        // Para probar, simular éxito
        // En un caso real, aquí llamarías a tu API de autenticación
        const user = {
          id: 1,
          username: this.credentials.username,
          name: 'Usuario Demo',
          role: 'user'
        };
        
        // Si tienes un store configurado, aquí establecerías el usuario
        if (this.$store && this.$store.dispatch) {
          await this.$store.dispatch('auth/login', { 
            user,
            token: 'demo-token-123'
          });
        }
        
        // Redirección
        const redirectPath = this.$route.query.redirect || '/';
        this.$router.push(redirectPath);
        
      } catch (err) {
        console.error('Error al iniciar sesión:', err);
        this.error = 'Error al iniciar sesión. Verifica tus credenciales.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.btn-login {
  width: 100%;
  padding: 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-login:hover {
  background-color: #2563eb;
}

.btn-login:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.login-links {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-links a {
  text-decoration: none;
  color: #3b82f6;
  font-size: 14px;
}

.login-links a:hover {
  text-decoration: underline;
}
</style>