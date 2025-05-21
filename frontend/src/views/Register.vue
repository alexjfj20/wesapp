<template>
  <div class="register">
    <div class="register-container">
      <h1>Crear Cuenta</h1>
      
      <form @submit.prevent="register" class="register-form">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input 
            id="username"
            v-model="form.username"
            type="text"
            placeholder="Nombre de usuario"
            required
            autocomplete="username"
          >
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="form.email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
            autocomplete="email"
          >
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">Nombre</label>
            <input 
              id="firstName"
              v-model="form.firstName"
              type="text"
              placeholder="Nombre"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="lastName">Apellido</label>
            <input 
              id="lastName"
              v-model="form.lastName"
              type="text"
              placeholder="Apellido"
              required
            >
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
            autocomplete="new-password"
          >
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input 
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="Repite la contraseña"
            required
            autocomplete="new-password"
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="isLoading" class="btn-register">
            {{ isLoading ? 'Registrando...' : 'Crear Cuenta' }}
          </button>
        </div>
        
        <div class="register-links">
          <router-link to="/login">¿Ya tienes cuenta? Inicia sesión</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Register',
  data() {
    return {
      form: {
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: ''
      },
      error: null,
      isLoading: false
    };
  },
  methods: {
    async register() {
      try {
        this.error = null;
        
        // Validar formulario
        if (this.form.password !== this.form.confirmPassword) {
          this.error = 'Las contraseñas no coinciden';
          return;
        }
        
        if (this.form.password.length < 8) {
          this.error = 'La contraseña debe tener al menos 8 caracteres';
          return;
        }
        
        this.isLoading = true;
        
        // Simular llamada a API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('Intentando registrar usuario:', this.form.username);
        
        // Para probar, simular éxito
        // En un caso real, aquí llamarías a tu API para registrar
        const user = {
          id: 2,
          username: this.form.username,
          email: this.form.email,
          name: `${this.form.firstName} ${this.form.lastName}`,
          role: 'user'
        };
        
        // Si tienes un store configurado, aquí establecerías el usuario
        if (this.$store && this.$store.dispatch) {
          await this.$store.dispatch('auth/register', { 
            user, 
            token: 'demo-token-456'
          });
        }
        
        // Redirección
        this.$router.push('/');
        
      } catch (err) {
        console.error('Error al registrarse:', err);
        this.error = 'Error al registrar cuenta. Inténtalo de nuevo.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.register {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.register-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
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

.btn-register {
  width: 100%;
  padding: 12px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-register:hover {
  background-color: #059669;
}

.btn-register:disabled {
  background-color: #a7f3d0;
  cursor: not-allowed;
}

.register-links {
  margin-top: 20px;
  text-align: center;
}

.register-links a {
  text-decoration: none;
  color: #3b82f6;
  font-size: 14px;
}

.register-links a:hover {
  text-decoration: underline;
}
</style>