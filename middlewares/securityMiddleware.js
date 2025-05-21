// Middleware de seguridad para detectar y bloquear solicitudes maliciosas
const { Op } = require('sequelize');
const db = require('../models');

// Middleware principal de seguridad
exports.securityCheck = async (req, res, next) => {
  try {
    // Obtener información básica de la solicitud
    const ip = req.ip || req.connection.remoteAddress;
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'];
    
    // 1. Verificar si la IP está en la lista de bloqueo
    const blockedIP = await checkBlockedIP(ip);
    if (blockedIP) {
      console.log(`IP bloqueada rechazada: ${ip}, accediendo a: ${url}`);
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }
    
    // 2. Evaluar reglas de seguridad personalizadas
    const matchedRule = await evaluateSecurityRules(req);
    if (matchedRule && matchedRule.action === 'block') {
      // Registrar el intento bloqueado
      await logSuspiciousRequest(req, true, matchedRule.pattern);
      
      console.log(`Solicitud bloqueada por regla "${matchedRule.name}": ${ip}, accediendo a: ${url}`);
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }
    
    if (matchedRule && matchedRule.action === 'redirect') {
      return res.redirect(matchedRule.redirectTo || '/');
    }
    
    // 3. Evaluar patrones de ataque comunes
    const attackPattern = detectCommonAttackPattern(url);
    if (attackPattern) {
      // Registrar el intento
      await logSuspiciousRequest(req, false, attackPattern);
    }
    
    // Si llegamos aquí, la solicitud puede continuar
    next();
  } catch (error) {
    console.error('Error en middleware de seguridad:', error);
    // En caso de error, permitimos que la solicitud continúe
    next();
  }
};

// Verificar si una IP está bloqueada
async function checkBlockedIP(ip) {
  try {
    // Si la base de datos no está disponible, retornar false para evitar bloqueos innecesarios
    if (!db.BlockedIP) return false;
    
    const blockedIP = await db.BlockedIP.findOne({
      where: {
        ip,
        isActive: true,
        [Op.or]: [
          { expiresAt: null }, // Sin expiración (permanente)
          { expiresAt: { [Op.gt]: new Date() } } // No ha expirado aún
        ]
      }
    });
    
    return !!blockedIP;
  } catch (error) {
    console.error('Error al verificar IP bloqueada:', error);
    return false;
  }
}

// Evaluar reglas de seguridad personalizadas
async function evaluateSecurityRules(req) {
  try {
    if (!db.SecurityRule) return null;
    
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;
    
    // Obtener todas las reglas activas
    const activeRules = await db.SecurityRule.findAll({
      where: {
        isActive: true
      }
    });
    
    // Evaluar cada regla
    for (const rule of activeRules) {
      let contentToCheck = '';
          // Seleccionar el contenido a evaluar según el tipo de patrón
      switch (rule.patternType) {
        case 'url':
          contentToCheck = url;
          break;
        case 'userAgent':
          contentToCheck = userAgent;
          break;
        case 'ip':
          contentToCheck = ip;
          break;
        case 'header': {
          // Para headers, el patrón debería estar en formato "headerName:value"
          const [headerName] = rule.pattern.split(':');
          contentToCheck = req.headers[headerName.toLowerCase()] || '';
          break;
        }
        case 'queryParam': {
          // Para query params, el patrón debería estar en formato "paramName:value"
          const [paramName] = rule.pattern.split(':');
          contentToCheck = req.query[paramName] || '';
          break;
        }
        default:
          contentToCheck = url;
      }
      
      // Evaluar el patrón
      let matches = false;
      
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.pattern);
          matches = regex.test(contentToCheck);
        } catch (error) {
          console.error(`Error en expresión regular "${rule.pattern}":`, error);
        }
      } else {
        matches = contentToCheck.includes(rule.pattern);
      }
      
      if (matches) {
        return rule;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error al evaluar reglas de seguridad:', error);
    return null;
  }
}

// Detectar patrones de ataque comunes
function detectCommonAttackPattern(url) {
  // Importar configuración de seguridad
  const securityConfig = require('../config/securityConfig');
  
  for (const pattern of securityConfig.commonAttackPatterns) {
    if (url.includes(pattern)) {
      return pattern;
    }
  }
  
  return null;
}

// Registrar solicitud sospechosa
async function logSuspiciousRequest(req, wasBlocked, pattern) {
  try {
    if (!db.SuspiciousRequest) return;
    
    const ip = req.ip || req.connection.remoteAddress;
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'];
    
    // Calcular puntuación de riesgo
    let riskScore = 0;
    
    // Basado en el patrón detectado
    if (pattern && ['wp-admin', 'setup-config.php', '.env'].includes(pattern)) {
      riskScore += 60;
    } else if (pattern) {
      riskScore += 40;
    }
    
    // Crear registro
    await db.SuspiciousRequest.create({
      url,
      ip,
      userAgent,
      method: req.method,
      headers: JSON.stringify(req.headers),
      pattern,
      riskScore,
      wasBlocked
    });
  } catch (error) {
    console.error('Error al registrar solicitud sospechosa:', error);
  }
}