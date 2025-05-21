<template>
  <div class="notifications-container">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification--${notification.type}`]"
        @click="removeNotification(notification.id)"
      >
        <div class="notification__icon" v-if="notification.type">
          <i :class="getIconClass(notification.type)"></i>
        </div>
        <div class="notification__content">
          <div class="notification__title" v-if="notification.title">{{ notification.title }}</div>
          <div class="notification__message">{{ notification.message }}</div>
        </div>
        <button class="notification__close" @click.stop="removeNotification(notification.id)">
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'Notifications',
  data() {
    return {
      notifications: [],
      nextId: 1
    };
  },
  created() {
    // Registrar el servicio de notificaciones en la instancia de Vue
    this.$root.$notifications = {
      add: this.addNotification
    };
  },
  methods: {
    /**
     * Añade una nueva notificación
     * @param {Object} notification - Configuración de la notificación
     * @param {string} notification.type - Tipo de notificación (success, error, warning, info)
     * @param {string} notification.message - Mensaje a mostrar
     * @param {string} [notification.title] - Título (opcional)
     * @param {number} [notification.duration] - Duración en ms (por defecto 5000)
     * @returns {number} ID de la notificación
     */
    addNotification({ type = 'info', message, title = null, duration = 5000 }) {
      const id = this.nextId++;
      const notification = {
        id,
        type,
        message,
        title,
        duration
      };
      
      this.notifications.push(notification);
      
      // Auto-eliminar después de la duración
      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, duration);
      }
      
      return id;
    },
    
    /**
     * Elimina una notificación por su ID
     * @param {number} id - ID de la notificación a eliminar
     */
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },
    
    /**
     * Devuelve la clase de icono según el tipo
     * @param {string} type - Tipo de notificación
     * @returns {string} Clase de icono
     */
    getIconClass(type) {
      switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-times-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': return 'fas fa-info-circle';
        default: return 'fas fa-bell';
      }
    }
  }
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  width: 320px;
  max-width: calc(100vw - 40px);
}

.notification {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  background-color: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification__icon {
  font-size: 20px;
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.notification__content {
  flex: 1;
}

.notification__title {
  font-weight: bold;
  margin-bottom: 5px;
}

.notification__message {
  word-break: break-word;
}

.notification__close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0;
  margin-left: 10px;
  line-height: 1;
}

.notification__close:hover {
  color: #333;
}

/* Tipos de notificación */
.notification--success {
  border-left: 4px solid #10b981;
}

.notification--success .notification__icon {
  color: #10b981;
}

.notification--error {
  border-left: 4px solid #ef4444;
}

.notification--error .notification__icon {
  color: #ef4444;
}

.notification--warning {
  border-left: 4px solid #f59e0b;
}

.notification--warning .notification__icon {
  color: #f59e0b;
}

.notification--info {
  border-left: 4px solid #3b82f6;
}

.notification--info .notification__icon {
  color: #3b82f6;
}

/* Animaciones */
.notification-enter-active, .notification-leave-active {
  transition: all 0.3s;
}

.notification-enter-from, .notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.notification-move {
  transition: transform 0.3s;
}
</style>