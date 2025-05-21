const LogActividad = require('../models/LogActividad');
const logger = require('../config/logger');

/**
 * Crea un nuevo registro de actividad en la base de datos
 */
exports.createLogActividad = async (logData) => {
  try {
    const log = await LogActividad.create({
      usuario_id: logData.usuario_id,
      accion: logData.accion,
      fecha: new Date(),
      ip: logData.ip || null
    });
    
    logger.info(`Actividad registrada: [${logData.accion}] Usuario ID: ${logData.usuario_id}`);
    return log;
  } catch (error) {
    logger.error(`Error al registrar actividad: ${error.message}`);
    throw new Error('Error al registrar la actividad del usuario');
  }
};

/**
 * Obtiene los registros de actividad filtrados por usuario y/o fecha
 */
exports.getLogsActividad = async (filtros = {}) => {
  try {
    const where = {};
    
    // Aplicar filtros si existen
    if (filtros.usuario_id) {
      where.usuario_id = filtros.usuario_id;
    }
    
    if (filtros.fechaInicio && filtros.fechaFin) {
      where.fecha = {
        [Op.between]: [
          new Date(filtros.fechaInicio), 
          new Date(filtros.fechaFin)
        ]
      };
    }
    
    const logs = await LogActividad.findAll({
      where,
      order: [['fecha', 'DESC']],
      include: [
        {
          model: Usuario,
          attributes: ['nombre', 'email']
        }
      ]
    });
    
    return logs;
  } catch (error) {
    logger.error(`Error al obtener logs de actividad: ${error.message}`);
    throw new Error('Error al obtener los registros de actividad');
  }
};
