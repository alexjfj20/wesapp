const LogActividad = require('../models/LogActividad');

// Middleware para registro de actividad
const logger = async (req, res, next) => {
  const start = Date.now();
  
  // Detectar y manejar headers demasiado grandes
  try {
    const headerSize = JSON.stringify(req.headers).length;
    if (headerSize > 8192) { // 8KB es un tamaño razonable para headers
      console.warn(`Headers demasiado grandes (${headerSize} bytes) en solicitud ${req.method} ${req.path}`);
      
      // MODIFICACIÓN IMPORTANTE: Permitir siempre todas las solicitudes independientemente del tamaño de header
      // Eliminar cookies y algunos headers problemáticos para reducir el tamaño
      if (req.headers.cookie) {
        console.warn('Eliminando cookies grandes para permitir la solicitud');
        delete req.headers.cookie;
      }
      
      // Para endpoints críticos, asegurar que pasen
      if (req.path.includes('/api/test') || 
          req.path.includes('/api/platos') || 
          req.path.includes('/api/sync')) {
        console.warn('Permitiendo solicitud con headers grandes para endpoints críticos');
      }
    }
  } catch (error) {
    console.error('Error al procesar headers:', error);
  }
  
  // Siempre continuar con el siguiente middleware, no bloquear solicitudes por headers grandes
  
  res.on('finish', async () => {
    // Solo registrar rutas importantes (no recursos estáticos)
    if (req.path.startsWith('/api/')) {
      try {
        const duration = Date.now() - start;
        const { method, path, user } = req;
        const { statusCode } = res;
        
        console.log(`${method} ${path} ${statusCode} - ${duration}ms`);
        
        // Si el usuario está autenticado, registrar la actividad
        if (user && user.id) {
          await LogActividad.create({
            usuario_id: user.id,
            accion: `${method} ${path} ${statusCode}`,
            ip: req.ip
          });
        }
      } catch (error) {
        console.error('Error al registrar actividad:', error);
      }
    }
  });
  
  next();
};

module.exports = logger;
