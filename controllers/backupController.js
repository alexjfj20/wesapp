// Controlador para gestión de backups
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Directorio para almacenar backups
const BACKUP_DIR = path.join(__dirname, '../backups');

// Asegurarse de que el directorio de backups exista
const ensureBackupDir = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error al crear directorio de backups:', error);
    throw error;
  }
};

/**
 * Crear un backup de la base de datos
 */
exports.createBackup = async (req, res) => {
  try {
    await ensureBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Obtener configuración de BD desde variables de entorno
    const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
    
    // Ejecutar comando mysqldump para crear backup
    await execPromise(
      `mysqldump -h ${DB_HOST} -u ${DB_USER} ${DB_PASS ? `-p${DB_PASS}` : ''} ${DB_NAME} > ${filePath}`
    );
    
    return res.status(200).json({
      success: true,
      message: 'Backup creado correctamente',
      data: { filename }
    });
  } catch (error) {
    console.error('Error al crear backup:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear backup',
      error: error.message
    });
  }
};

/**
 * Obtener lista de backups disponibles
 */
exports.getBackups = async (req, res) => {
  try {
    await ensureBackupDir();
    
    const files = await fs.readdir(BACKUP_DIR);
    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.sql'))
        .map(async file => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.stat(filePath);
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
    );
    
    return res.status(200).json({
      success: true,
      message: 'Lista de backups obtenida correctamente',
      data: backups
    });
  } catch (error) {
    console.error('Error al obtener lista de backups:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener lista de backups',
      error: error.message
    });
  }
};

/**
 * Restaurar un backup específico
 */
exports.restoreBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Verificar que el archivo exista
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }
    
    // Obtener configuración de BD desde variables de entorno
    const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
    
    // Ejecutar comando mysql para restaurar backup
    await execPromise(
      `mysql -h ${DB_HOST} -u ${DB_USER} ${DB_PASS ? `-p${DB_PASS}` : ''} ${DB_NAME} < ${filePath}`
    );
    
    return res.status(200).json({
      success: true,
      message: 'Backup restaurado correctamente'
    });
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al restaurar backup',
      error: error.message
    });
  }
};

/**
 * Descargar un backup específico
 */
exports.downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Verificar que el archivo exista
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }
    
    // Enviar archivo para descargar
    res.download(filePath);
  } catch (error) {
    console.error('Error al descargar backup:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al descargar backup',
      error: error.message
    });
  }
};

/**
 * Eliminar un backup específico
 */
exports.deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // Verificar que el archivo exista
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }
    
    // Eliminar archivo
    await fs.unlink(filePath);
    
    return res.status(200).json({
      success: true,
      message: 'Backup eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar backup:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar backup',
      error: error.message
    });
  }
};
