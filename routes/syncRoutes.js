/**
 * Rutas relacionadas con la sincronización de datos
 */
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { query, getConnection } = require('../config/dbPool'); // Importamos el pool de conexiones

// Cargar variables de entorno
dotenv.config();

// Controlador simple para manejar solicitudes de sincronización
// En una implementación real, esto interactuaría con una base de datos
// o servicios externos

/**
 * Verifica el estado de la sincronización
 */
router.get('/status', async (req, res) => {
  try {
    console.log('📊 Recibida solicitud para verificar estado de sincronización');
    
    // Datos de conexión
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'websap'
    };
    
    console.log('⚙️ Intentando conectar a MySQL con:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    // Intentar conectar a MySQL
    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('✅ Conexión a MySQL establecida');
    } catch (dbError) {
      console.error('❌ Error al conectar a MySQL:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Error de conexión a la base de datos',
        error: dbError.message,
        data: {
          mysql: {
            connected: false,
            tablaPlatos: false,
            cantidadPlatos: 0
          },
          config: {
            host: dbConfig.host,
            database: dbConfig.database,
            sincronizacionActivada: process.env.SYNC_ENABLED === 'true'
          }
        }
      });
    }
    
    // Verificar si existe la tabla platos
    let tablaPlatos = false;
    let cantidadPlatos = 0;
    
    try {
      const [tables] = await connection.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_NAME = 'platos' AND TABLE_SCHEMA = ?
      `, [dbConfig.database]);
      
      tablaPlatos = tables.length > 0;
      console.log(`✅ Tabla 'platos' existe: ${tablaPlatos}`);
      
      // Si la tabla existe, contar registros
      if (tablaPlatos) {
        const [result] = await connection.query('SELECT COUNT(*) as count FROM platos');
        cantidadPlatos = result[0].count;
        console.log(`📊 Cantidad de platos en MySQL: ${cantidadPlatos}`);
      }
    } catch (tableError) {
      console.error('❌ Error al verificar tabla platos:', tableError.message);
    }
    
    // Cerrar conexión
    await connection.end();
    
    // Responder con estado completo
    return res.status(200).json({
      success: true,
      message: 'Estado de sincronización obtenido correctamente',
      data: {
        mysql: {
          connected: true,
          tablaPlatos: tablaPlatos,
          cantidadPlatos: cantidadPlatos
        },
        config: {
          host: dbConfig.host,
          database: dbConfig.database,
          sincronizacionActivada: process.env.SYNC_ENABLED === 'true'
        }
      }
    });
  } catch (error) {
    console.error('❌ Error general al verificar estado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar estado de sincronización',
      error: error.message
    });
  }
});

/**
 * Inicia un proceso de sincronización manual
 */
router.post('/start', (req, res) => {
  // Simulación de sincronización
  res.status(200).json({
    success: true,
    message: 'Sincronización iniciada manualmente',
    timestamp: new Date().toISOString()
  });
});

/**
 * Obtiene el historial de sincronización
 */
router.get('/history', (req, res) => {
  // Simulación de historial
  const history = [
    {
      id: 1,
      status: 'success',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      duration: 25 // segundos
    },
    {
      id: 2,
      status: 'success',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      duration: 32 // segundos
    }
  ];
  
  res.status(200).json({
    success: true,
    history
  });
});

// Endpoint para sincronización de platos
router.post('/platos', async (req, res) => {
  try {
    console.log('Recibida solicitud de sincronización de plato');
    
    // Validar que tenemos datos básicos
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Datos de plato incompletos'
      });
    }

    // Verificar si es una operación de eliminación
    const isDeleteOperation = req.body.operation === 'delete';
    
    // Si es una operación de eliminación, procesarla de forma diferente
    if (isDeleteOperation && req.body.id) {
      console.log(`Procesando eliminación del plato ID: ${req.body.id}`);
      
      // Datos de conexión
      const dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
      };
      
      // Crear conexión
      const connection = await mysql.createConnection(dbConfig);
      
      try {
        // Verificar si el plato existe
        const [rows] = await connection.query(
          'SELECT id FROM platos WHERE id = ?',
          [req.body.id]
        );
        
        if (rows.length === 0) {
          await connection.end();
          return res.status(404).json({
            success: false,
            message: 'Plato no encontrado'
          });
        }
        
        // Eliminar el plato
        const [result] = await connection.query(
          'DELETE FROM platos WHERE id = ?',
          [req.body.id]
        );
        
        await connection.end();
        
        if (result.affectedRows > 0) {
          return res.json({
            success: true,
            message: 'Plato eliminado con éxito',
            id: req.body.id
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'No se pudo eliminar el plato'
          });
        }
      } catch (error) {
        await connection.end();
        console.error('Error al eliminar plato:', error);
        return res.status(500).json({
          success: false,
          message: 'Error al eliminar plato',
          error: error.message
        });
      }
    }
    
    // Si no es una operación de eliminación, continuar con el código existente
    console.log('Datos recibidos para sincronización:', req.body);
    
    // Verificar si el plato ya existe por ID
    let existingPlatoById = await query('SELECT * FROM platos WHERE id = ?', [req.body.id]);
    
    // Si no existe por ID, verificar si existe por nombre
    let existingPlatoByName = [];
    if (existingPlatoById.length === 0 && req.body.name) {
      existingPlatoByName = await query('SELECT * FROM platos WHERE name = ?', [req.body.name]);
    }
    
    // Determinar el ID del plato (existente o nuevo)
    const platoId = req.body.id;
    const platoName = req.body.name || 'Plato sin nombre';
    
    if (existingPlatoById.length > 0 || existingPlatoByName.length > 0) {
      // Actualizar plato existente
      const targetId = existingPlatoById.length > 0 ? existingPlatoById[0].id : existingPlatoByName[0].id;
      console.log(`Actualizando plato existente: ${targetId}`);
      
      await query(
        'UPDATE platos SET name = ?, price = ?, description = ?, image = ?, is_available = ?, syncStatus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          platoName,
          req.body.price || 0,
          req.body.description || '',
          req.body.image || null,
          req.body.is_available !== false ? 1 : 0,
          'synced',
          targetId
        ]
      );
      
      console.log(`Plato actualizado: ${targetId}`);
      
      return res.status(200).json({
        success: true,
        message: 'Plato actualizado correctamente',
        data: { id: targetId }
      });
    } else {
      // Crear nuevo plato
      console.log(`Creando nuevo plato: ${platoId}`);
      
      await query(
        'INSERT INTO platos (id, name, price, description, image, is_available, syncStatus, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [
          platoId,
          platoName,
          req.body.price || 0,
          req.body.description || '',
          req.body.image || null,
          req.body.is_available !== false ? 1 : 0,
          'synced'
        ]
      );
      
      console.log(`Nuevo plato creado: ${platoId}`);
      
      return res.status(200).json({
        success: true,
        message: 'Plato sincronizado correctamente',
        data: { id: platoId }
      });
    }
  } catch (error) {
    console.error('❌ Error general en sincronización de plato:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en sincronización de plato',
      error: error.message
    });
  }
});

// Endpoint para eliminar un plato
router.delete('/platos/:id', async (req, res) => {
  try {
    const platoId = req.params.id;
    console.log(`Recibida solicitud para eliminar plato: ${platoId}`);
    
    // Verificar si el plato existe
    const existingPlato = await query('SELECT * FROM platos WHERE id = ?', [platoId]);
    
    if (existingPlato.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plato no encontrado'
      });
    }
    
    // Eliminar el plato
    await query('DELETE FROM platos WHERE id = ?', [platoId]);
    
    console.log(`Plato eliminado: ${platoId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Plato eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar plato:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar plato',
      error: error.message
    });
  }
});

// Endpoint para configurar sincronización (crear tablas)
router.post('/setup', async (req, res) => {
  try {
    console.log('🔧 Recibida solicitud para configurar sincronización');
    
    // Verificar si la tabla platos existe
    const tables = await query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = 'platos'",
      [process.env.DB_NAME || 'websap']
    );
    
    const tablasExistentes = tables.map(t => t.table_name || t.TABLE_NAME);
    const tablaExiste = tablasExistentes.includes('platos');
    
    console.log(`✅ Tabla 'platos' existe: ${tablaExiste}`);
    
    if (!tablaExiste) {
      // Crear la tabla platos si no existe
      await query(`
        CREATE TABLE platos (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          description TEXT,
          image LONGTEXT,
          is_available BOOLEAN DEFAULT TRUE,
          syncStatus VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabla platos creada correctamente');
    }
    
    return res.json({
      success: true,
      message: 'Configuración completada correctamente',
      tablaExiste
    });
  } catch (error) {
    console.error('❌ Error al configurar sincronización:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al configurar sincronización',
      error: error.message
    });
  }
});

// Endpoint para prueba simple de ping
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ping exitoso',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de estado de sincronización
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'active',
    message: 'Servicio de sincronización activo',
    lastSync: new Date(Date.now() - 300000).toISOString(),
    nextSync: new Date(Date.now() + 300000).toISOString(),
    timestamp: new Date().toISOString()
  });
});

// Endpoint para iniciar sincronización manual
router.post('/start', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sincronización iniciada manualmente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
