const cron = require('node-cron');
const { Op } = require('sequelize');
const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');
const Mensaje = require('../models/Mensaje');
const { 
  enviarNotificacionPagoPendiente, 
  enviarFelicitacionPago 
} = require('./emailService');
const backupService = require('./backupService');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs').promises;

// Directorio para almacenar respaldos
const BACKUP_DIR = path.join(__dirname, '../backups');

/**
 * Inicializar todas las tareas programadas
 */
function initScheduledTasks() {
  // Verificar pagos pendientes diariamente a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Ejecutando tarea programada: verificación de pagos pendientes');
    await verificarPagosPendientes();
  });
  
  // Crear backup semanal - domingo a las 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('Ejecutando tarea programada: backup semanal');
    await realizarBackupSemanal();
  });
  
  // Limpiar logs antiguos - primer día de cada mes a las 4:00 AM
  cron.schedule('0 4 1 * *', async () => {
    console.log('Ejecutando tarea programada: limpieza de logs antiguos');
    await limpiarLogsAntiguos();
  });
  
  // Respaldo diario automático a las 3:00 AM
  cron.schedule('0 3 * * *', () => {
    logger.info('Ejecutando tarea de respaldo automático');
    createAutomaticBackup();
  });
  
  // Limpieza de respaldos antiguos cada domingo a las 4:00 AM
  cron.schedule('0 4 * * 0', () => {
    logger.info('Ejecutando limpieza de respaldos antiguos');
    cleanOldBackups();
  });
  
  console.log('Tareas programadas inicializadas correctamente');
  logger.info('Tareas programadas inicializadas correctamente');
}

/**
 * Verificar pagos pendientes y enviar notificaciones
 */
async function verificarPagosPendientes() {
  try {
    // Obtener fecha actual
    const hoy = new Date();
    
    // Buscar pagos pendientes
    const pagosPendientes = await Pago.findAll({
      where: {
        estado: 'pendiente',
        fecha_vencimiento: {
          [Op.gte]: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 30), // Hasta 30 días vencidos
          [Op.lte]: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7)  // Hasta 7 días por vencer
        }
      },
      include: [{
        model: Usuario,
        where: {
          estado: 'activo'
        }
      }]
    });
    
    console.log(`Se encontraron ${pagosPendientes.length} pagos pendientes para notificar`);
    
    // Enviar notificaciones
    for (const pago of pagosPendientes) {
      const usuario = pago.Usuario;
      
      try {
        // Enviar notificación
        await enviarNotificacionPagoPendiente(usuario, pago);
        
        // Registrar mensaje enviado
        await Mensaje.create({
          usuario_id: usuario.id,
          tipo: 'aviso_pago',
          contenido: `Recordatorio de pago pendiente con vencimiento el ${pago.fecha_vencimiento}`,
          fecha_envio: new Date()
        });
        
        console.log(`Notificación de pago enviada al usuario ${usuario.id} - ${usuario.email}`);
      } catch (error) {
        console.error(`Error al enviar notificación al usuario ${usuario.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error al verificar pagos pendientes:', error);
  }
}

/**
 * Realizar backup semanal de la base de datos
 */
async function realizarBackupSemanal() {
  try {
    const resultado = await backupService.createBackup();
    console.log('Backup semanal realizado exitosamente:', resultado);
    
    // Eliminar backups antiguos (más de 3 meses)
    const backups = await backupService.getBackups();
    
    const tresAnteriores = new Date();
    tresAnteriores.setMonth(tresAnteriores.getMonth() - 3);
    
    for (const backup of backups) {
      if (new Date(backup.fecha) < tresAnteriores) {
        try {
          await backupService.deleteBackup(backup.id);
          console.log(`Backup antiguo eliminado: ${backup.id} - ${backup.fecha}`);
        } catch (error) {
          console.error(`Error al eliminar backup antiguo ${backup.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error al realizar backup semanal:', error);
  }
}

/**
 * Limpiar logs antiguos (más de 6 meses)
 */
async function limpiarLogsAntiguos() {
  try {
    const LogActividad = require('../models/LogActividad');
    
    const seisAnteriores = new Date();
    seisAnteriores.setMonth(seisAnteriores.getMonth() - 6);
    
    const resultado = await LogActividad.destroy({
      where: {
        fecha: {
          [Op.lt]: seisAnteriores
        }
      }
    });
    
    console.log(`Se eliminaron ${resultado} logs antiguos`);
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error);
  }
}

/**
 * Realiza un respaldo automático de la base de datos
 */
const createAutomaticBackup = async () => {
  try {
    // Asegurarse de que el directorio existe
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Generar nombre del archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto_backup_${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    
    // En una implementación real, aquí se haría el respaldo de la base de datos
    // Para esta simulación, solo creamos un archivo
    const backupData = `-- Backup automático generado el ${new Date().toISOString()}
-- Respaldo automático programado
-- Database: ${process.env.DB_NAME || 'websap_db'}
-- Timestamp: ${new Date().toISOString()}
`;
    
    await fs.writeFile(filePath, backupData);
    logger.info(`Respaldo automático creado: ${filename}`);
  } catch (error) {
    logger.error(`Error al crear respaldo automático: ${error.message}`);
  }
};

/**
 * Elimina respaldos antiguos (más de 30 días)
 */
const cleanOldBackups = async () => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      
      // Si el archivo es más antiguo que 30 días, eliminarlo
      if (stats.birthtime < thirtyDaysAgo) {
        await fs.unlink(filePath);
        logger.info(`Respaldo antiguo eliminado: ${file}`);
      }
    }
  } catch (error) {
    logger.error(`Error al limpiar respaldos antiguos: ${error.message}`);
  }
};

module.exports = {
  initScheduledTasks,
  verificarPagosPendientes,
  realizarBackupSemanal,
  limpiarLogsAntiguos,
  createAutomaticBackup,
  cleanOldBackups
};
