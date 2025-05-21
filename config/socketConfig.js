/**
 * Configuración de Socket.IO para WebSAP
 * Este módulo proporciona acceso a la instancia de Socket.IO
 * para enviar notificaciones en tiempo real desde diferentes partes de la aplicación
 */

// Este archivo actúa como un singleton para acceder a la instancia de Socket.IO
// La instancia real se inicializa en server.js cuando arranca el servidor

// Variable global para almacenar la instancia de socket.io
let io = null;

/**
 * Inicializa la instancia de Socket.IO
 * @param {Object} socketIoInstance - Instancia de socket.io inicializada en server.js
 */
const initialize = (socketIoInstance) => {
  io = socketIoInstance;
  
  // Guardar en el objeto global para acceso desde cualquier parte de la aplicación
  global.io = socketIoInstance;
  
  console.log('Socket.IO inicializado correctamente para notificaciones en tiempo real');
  
  // Configuraciones adicionales
  if (io) {
    // Middleware para autenticación en sockets (opcional)
    io.use((socket, next) => {
      // Aquí podrías verificar autenticación si es necesario
      next();
    });
    
    // Manejar conexiones nuevas
    io.on('connection', socket => {
      console.log('Nueva conexión Socket.IO establecida:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Conexión Socket.IO cerrada:', socket.id);
      });
    });
  }
};

// Exportar un objeto que proporcione acceso a la instancia e inicialización
module.exports = {
  initialize,
  // Getter para acceder a la instancia de Socket.IO
  get io() {
    return io;
  }
};