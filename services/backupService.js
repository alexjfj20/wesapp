const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../models');
const RespaldoDato = require('../models/RespaldoDato');

// Directorio para almacenar backups
const BACKUP_DIR = path.join(__dirname, '../backups');

/**
 * Crear directorio de backups si no existe
 */
async function initializeBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log('Directorio de backups inicializado');
  } catch (error) {
    console.error('Error al crear directorio de backups:', error);
    throw error;
  }
}

/**
 * Crear un backup completo de la base de datos
 * @returns {Promise<Object>} Información del backup creado
 */
async function createBackup() {
  try {
    // Asegurar que existe el directorio de backups
    await initializeBackupDir();
    
    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    // Obtener datos de todas las tablas
    const models = sequelize.models;
    const data = {};
    
    for (const modelName in models) {
      if (Object.prototype.hasOwnProperty.call(models, modelName)) {
        const Model = models[modelName];
        data[modelName] = await Model.findAll();
      }
    }
    
    // Guardar datos en un archivo JSON
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    // Registrar backup en la base de datos
    const backup = await RespaldoDato.create({
      fecha: new Date(),
      archivo: fileName
    });
    
    console.log(`Backup creado: ${fileName}`);
    
    return {
      id: backup.id,
      fecha: backup.fecha,
      archivo: backup.archivo,
      path: filePath
    };
  } catch (error) {
    console.error('Error al crear backup:', error);
    throw error;
  }
}

/**
 * Restaurar datos desde un backup
 * @param {number} backupId - ID del backup a restaurar
 * @returns {Promise<Object>} Resultado de la restauración
 */
async function restoreBackup(backupId) {
  try {
    // Buscar el registro del backup
    const backup = await RespaldoDato.findByPk(backupId);
    
    if (!backup) {
      throw new Error(`Backup con ID ${backupId} no encontrado`);
    }
    
    // Construir ruta al archivo de backup
    const filePath = path.join(BACKUP_DIR, backup.archivo);
    
    // Verificar si existe el archivo
    try {
      await fs.access(filePath);
    } catch (err) {
      throw new Error(`Archivo de backup no encontrado: ${backup.archivo}`);
    }
    
    // Leer datos del backup
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Restaurar datos a cada modelo
    const models = sequelize.models;
    
    // Usar una transacción para garantizar atomicidad
    const t = await sequelize.transaction();
    
    try {
      for (const modelName in data) {
        if (Object.prototype.hasOwnProperty.call(data, modelName) && models[modelName]) {
          const Model = models[modelName];
          
          // Eliminar datos existentes
          await Model.destroy({ truncate: true, cascade: true, transaction: t });
          
          // Insertar datos del backup
          if (data[modelName].length > 0) {
            await Model.bulkCreate(data[modelName], { transaction: t });
          }
        }
      }
      
      // Confirmar transacción
      await t.commit();
      
      console.log(`Backup restaurado: ${backup.archivo}`);
      
      return {
        success: true,
        message: `Backup restaurado correctamente: ${backup.archivo}`
      };
    } catch (error) {
      // Revertir transacción en caso de error
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    throw error;
  }
}

/**
 * Eliminar un backup por su ID
 * @param {number} backupId - ID del backup a eliminar
 * @returns {Promise<boolean>} Resultado de la eliminación
 */
async function deleteBackup(backupId) {
  try {
    // Buscar el registro del backup
    const backup = await RespaldoDato.findByPk(backupId);
    
    if (!backup) {
      throw new Error(`Backup con ID ${backupId} no encontrado`);
    }
    
    // Construir ruta al archivo de backup
    const filePath = path.join(BACKUP_DIR, backup.archivo);
    
    // Eliminar archivo si existe
    try {
      await fs.unlink(filePath);
      console.log(`Archivo de backup eliminado: ${backup.archivo}`);
    } catch (err) {
      console.warn(`Advertencia: No se pudo eliminar el archivo de backup ${backup.archivo}:`, err.message);
    }
    
    // Eliminar registro de la base de datos
    await backup.destroy();
    
    return true;
  } catch (error) {
    console.error('Error al eliminar backup:', error);
    throw error;
  }
}

/**
 * Obtener lista de backups disponibles
 * @returns {Promise<Array>} Lista de backups
 */
async function getBackups() {
  try {
    const backups = await RespaldoDato.findAll({
      order: [['fecha', 'DESC']]
    });
    
    return backups;
  } catch (error) {
    console.error('Error al obtener lista de backups:', error);
    throw error;
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  deleteBackup,
  getBackups,
  initializeBackupDir
};
