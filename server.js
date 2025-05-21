// Archivo de entrada principal para el servidor
const app = require('./app');
const db = require('./models');
const dbConnectionManager = require('./utils/dbConnectionManager');

// Puerto en el que se ejecutará el servidor
const PORT = process.env.PORT || 30011;

// Iniciar el servidor
const server = app.listen(PORT, async () => {
  console.log(`🚀 Servidor iniciado en el puerto ${PORT}`);
  
  // Inicializar la conexión a la base de datos
  try {
    const dbStatus = await dbConnectionManager.initializeConnection();
    
    if (dbStatus.success) {
      console.log('✅ Base de datos inicializada correctamente.');
      console.log(`   - Dialecto: ${dbStatus.dialect}`);
      console.log(`   - Base de datos: ${dbStatus.database}`);
      console.log(`   - Modelos cargados: ${dbStatus.models || 0}`);
    } else {
      console.error('❌ Error al inicializar la base de datos:', dbStatus.message);
    }
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('👋 Señal SIGTERM recibida. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 Señal SIGINT recibida. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente.');
    process.exit(0);
  });
});
