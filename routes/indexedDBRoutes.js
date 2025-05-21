// backend/routes/indexedDBRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Endpoint para obtener los platos almacenados en IndexedDB
router.get('/platos', async (req, res) => {
  try {
    console.log('Recibida solicitud para obtener platos de IndexedDB');
    
    // Ruta al archivo de respaldo de IndexedDB (si existe)
    const backupPath = path.join(__dirname, '../data/indexeddb_backup.json');
    
    // Verificar si existe el archivo de respaldo
    if (fs.existsSync(backupPath)) {
      console.log('Leyendo datos de respaldo de IndexedDB...');
      
      // Leer el archivo de respaldo
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      return res.status(200).json({
        success: true,
        message: 'Datos de IndexedDB obtenidos correctamente desde respaldo',
        data: backupData
      });
    } else {
      // Si no existe el archivo de respaldo, devolver un array vacío
      console.log('No se encontró archivo de respaldo de IndexedDB');
      
      return res.status(200).json({
        success: true,
        message: 'No se encontraron datos de respaldo de IndexedDB',
        data: []
      });
    }
  } catch (error) {
    console.error('Error al obtener platos de IndexedDB:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener platos de IndexedDB',
      error: error.message
    });
  }
});

// Endpoint para guardar un respaldo de los platos de IndexedDB
router.post('/backup', async (req, res) => {
  try {
    console.log('Recibida solicitud para guardar respaldo de IndexedDB');
    
    // Verificar que se recibieron datos
    if (!req.body || !req.body.platos) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron datos para el respaldo'
      });
    }
    
    const platos = req.body.platos;
    console.log(`Recibidos ${platos.length} platos para respaldo`);
    
    // Ruta al directorio de datos
    const dataDir = path.join(__dirname, '../data');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Crear un respaldo con timestamp para mantener versiones
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(dataDir, 'backups');
    
    // Crear directorio de respaldos si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Guardar una copia con timestamp
    const timestampBackupPath = path.join(backupDir, `indexeddb_backup_${timestamp}.json`);
    fs.writeFileSync(timestampBackupPath, JSON.stringify(platos, null, 2));
    console.log(`Respaldo con timestamp guardado en: ${timestampBackupPath}`);
    
    // Ruta al archivo de respaldo principal (el que se usa para sincronización)
    const backupPath = path.join(dataDir, 'indexeddb_backup.json');
    
    // Guardar los datos en el archivo de respaldo principal
    fs.writeFileSync(backupPath, JSON.stringify(platos, null, 2));
    console.log(`Respaldo principal guardado en: ${backupPath}`);
    
    // Contar cuántos platos tienen imágenes
    const platosConImagen = platos.filter(plato => plato.image && plato.image.length > 0);
    
    return res.status(200).json({
      success: true,
      message: `Respaldo de IndexedDB guardado correctamente. ${platosConImagen.length} de ${platos.length} platos tienen imágenes.`,
      data: {
        totalPlatos: platos.length,
        platosConImagen: platosConImagen.length,
        backupPath,
        timestampBackupPath
      }
    });
  } catch (error) {
    console.error('Error al guardar respaldo de IndexedDB:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar respaldo de IndexedDB',
      error: error.message
    });
  }
});

// Endpoint para sincronizar las imágenes originales desde IndexedDB a MySQL
router.post('/sync-images', async (req, res) => {
  try {
    console.log('Recibida solicitud para sincronizar imágenes originales');
    
    // Ruta al archivo de respaldo de IndexedDB
    const backupPath = path.join(__dirname, '../data/indexeddb_backup.json');
    
    // Verificar si existe el archivo de respaldo
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró archivo de respaldo de IndexedDB'
      });
    }
    
    // Leer el archivo de respaldo
    const indexedDBPlatos = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Importar el modelo Plato
    const { Plato } = require('../models');
    
    // Obtener todos los platos de MySQL
    const platosMySQL = await Plato.findAll();
    console.log(`Se encontraron ${platosMySQL.length} platos en la base de datos MySQL`);
    
    // Crear un directorio para respaldos de imágenes si no existe
    const imageBackupDir = path.join(__dirname, '../data/image_backups');
    if (!fs.existsSync(imageBackupDir)) {
      fs.mkdirSync(imageBackupDir, { recursive: true });
    }
    
    // Fecha para el nombre del archivo de respaldo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `mysql_images_backup_${timestamp}.json`;
    const imageBackupPath = path.join(imageBackupDir, backupFileName);
    
    // Crear un respaldo de las imágenes actuales en MySQL
    const mysqlImagesBackup = platosMySQL.map(plato => ({
      id: plato.id,
      name: plato.name,
      image: plato.image
    }));
    
    // Guardar el respaldo
    fs.writeFileSync(imageBackupPath, JSON.stringify(mysqlImagesBackup, null, 2));
    console.log(`Respaldo de imágenes de MySQL creado en: ${imageBackupPath}`);
    
    // Actualizar cada plato en MySQL con su imagen original de IndexedDB
    let actualizados = 0;
    let errores = 0;
    
    for (const platoMySQL of platosMySQL) {
      try {
        // Buscar el plato correspondiente en IndexedDB por ID
        let platoIndexedDB = indexedDBPlatos.find(p => p.id === platoMySQL.id);
        
        // Si no se encuentra por ID, intentar buscar por nombre
        if (!platoIndexedDB || !platoIndexedDB.image) {
          platoIndexedDB = indexedDBPlatos.find(p => 
            p.name && platoMySQL.name && 
            p.name.toLowerCase() === platoMySQL.name.toLowerCase() && 
            p.image
          );
        }
        
        if (platoIndexedDB && platoIndexedDB.image) {
          console.log(`Actualizando plato "${platoMySQL.name}" (ID: ${platoMySQL.id}) con imagen original de IndexedDB`);
          
          // Actualizar el plato en MySQL con la imagen de IndexedDB
          await platoMySQL.update({ 
            image: platoIndexedDB.image,
            updated_at: new Date()
          });
          
          actualizados++;
        } else {
          console.log(`No se encontró imagen original para el plato "${platoMySQL.name}" (ID: ${platoMySQL.id}) en IndexedDB`);
        }
      } catch (platoError) {
        console.error(`Error al actualizar plato "${platoMySQL.name}" (ID: ${platoMySQL.id}):`, platoError);
        errores++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Sincronización completada. ${actualizados} platos actualizados con imágenes originales. ${errores} platos con errores.`,
      data: { 
        actualizados,
        errores,
        backupCreado: imageBackupPath
      }
    });
  } catch (error) {
    console.error('Error al sincronizar imágenes originales:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al sincronizar imágenes originales',
      error: error.message
    });
  }
});

module.exports = router;
