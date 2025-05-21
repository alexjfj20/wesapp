// Si existe este archivo en vez de server.js, añadir:
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();
const { closePool } = require('./config/dbPool'); // Importamos la función para cerrar el pool
const runSystemChecks = require('./scripts/systemInitialCheck'); // Importamos las verificaciones del sistema
const db = require('./models');

// Importar middleware de seguridad
const securityMiddleware = require('./middlewares/securityMiddleware');

// Configurar bodyParser para manejar JSON
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de seguridad
const corsOptions = require('./config/cors-config');
app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://websap.site"],
      // Ajusta según tus necesidades
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  }
}));
app.use(morgan('combined'));

// Importar rutas
const syncRoutes = require('./routes/syncRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const systemStatusRoutes = require('./routes/systemStatusRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Añadido: importar rutas de admin
const userRoutes = require('./routes/userRoutes'); // Añadido: importar rutas de usuario
const authRoutes = require('./routes/authRoutes'); // Añadido: importar rutas de autenticación
const securityRoutes = require('./routes/securityRoutes'); // Añadido: importar rutas de seguridad
const testRoutes = require('./routes/testRoutes'); // Añadido: importar rutas de prueba

// Middleware para diagnóstico de rutas - registra todas las solicitudes
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  // Interceptar para poder registrar la respuesta
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    console.log(`📤 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Estado: ${res.statusCode} - Tiempo: ${responseTime}ms`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Aplicar middleware de seguridad a todas las rutas
app.use(securityMiddleware.securityCheck);

// Configuración mejorada para manejar errores CORS y de headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Endpoint simple para verificar si el servidor está activo (health check)
app.get('/api/health-check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'El servidor está funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint simple para verificar si el servidor está activo
app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Manejador de errores para cualquier error relacionado con headers
app.use((err, req, res, next) => {
  console.error(`❌ [${new Date().toISOString()}] Error en ruta ${req.method} ${req.originalUrl}:`, err);
  
  if (err.type === 'entity.too.large') {
    console.error('Payload demasiado grande');
    return res.status(413).json({
      success: false,
      error: 'Payload demasiado grande',
      path: req.originalUrl
    });
  }
  
  if (err.name === 'SyntaxError') {
    console.error('Error de sintaxis en la solicitud:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Solicitud malformada',
      details: err.message,
      path: req.originalUrl
    });
  }
  
  next(err);
});

// Registrar rutas
app.use('/api/sync', syncRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api', systemStatusRoutes);
app.use('/api/admin', adminRoutes); // Añadido: registrar rutas de admin
app.use('/api/users', userRoutes); // Añadido: registrar rutas de usuario
app.use('/api/auth', authRoutes); // Añadido: registrar rutas de autenticación
app.use('/api/security', securityRoutes); // Añadido: registrar rutas de seguridad
app.use('/api/test', testRoutes); // Añadido: registrar rutas de prueba

// Middleware para cualquier endpoint de API inexistente
app.all('/api/*', (req, res) => {
  console.error(`⚠️ [${new Date().toISOString()}] Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health-check',
      '/api/test/ping',
      '/api/admin/db-status',
      '/api/admin/db-reconnect',
      '/api/sync/status',
      '/api/sync/setup'
    ]
  });
});

// Manejador de métodos no permitidos (405)
app.use((req, res, next) => {
  if (res.headersSent) return next();
  
  // Convertir solicitudes con método incorrecto a JSON en vez de HTML
  res.status(405).json({
    success: false,
    error: 'Método no permitido',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Verifica que estás utilizando el método HTTP correcto (GET, POST, PUT, DELETE)'
  });
  
  // No es necesario llamar a next() ya que estamos terminando la respuesta
});

// Puerto para el servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
  
  // Ejecutar verificaciones iniciales del sistema
  runSystemChecks()
    .then(() => console.log('✅ Verificaciones del sistema completadas'))
    .catch(err => console.error('❌ Error en verificaciones del sistema:', err));
});

// Manejar el cierre adecuado del servidor y las conexiones
process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  
  try {
    // Cerrar el pool de conexiones
    await closePool();
    console.log('Pool de conexiones cerrado correctamente');
    
    // Cerrar el servidor
    server.close(() => {
      console.log('Servidor cerrado correctamente');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error al cerrar el servidor:', error);
    process.exit(1);
  }
});

// Middleware para manejar cualquier error no capturado - SIEMPRE DEBE SER EL ÚLTIMO
app.use((err, req, res, _next) => {
  console.error(`🔥 [${new Date().toISOString()}] Error no capturado en ${req.method} ${req.originalUrl}:`, err);
  
  // Garantizar que siempre se devuelva una respuesta JSON
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version
    }
  });
  
  // Este es el último middleware en la cadena, no necesita llamar a next()
});

// Sincronizar modelos con la base de datos
db.sequelize.sync()
  .then(() => {
    console.log('Base de datos sincronizada correctamente');
  })
  .catch(err => {
    console.error('Error al sincronizar la base de datos:', err);
  });

module.exports = app;
