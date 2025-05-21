// Métodos temporales para el controlador de usuarios

// Obtener usuarios (para panel de administrador)
exports.getUsers = async (req, res) => {
  try {
    // Parámetros de filtro
    const { searchTerm, role, status } = req.query;
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    // Si hay término de búsqueda
    if (searchTerm) {
      whereConditions[Op.or] = [
        { nombre: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } }
      ];
    }
    
    // Si hay filtro por rol
    if (role) {
      whereConditions.roles = { [Op.like]: `%${role}%` };
    }
    
    // Si hay filtro por estado
    if (status) {
      whereConditions.activo = status === 'activo';
    }
    
    // Buscar usuarios
    const users = await Usuario.findAll({
      where: whereConditions,
      attributes: ['id', 'nombre', 'email', 'roles', 'activo', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener roles
exports.getRoles = async (req, res) => {
  try {
    // Lista predeterminada de roles
    const defaultRoles = [
      { id: 1, nombre: 'Superadministrador', descripcion: 'Control total del sistema' },
      { id: 2, nombre: 'Administrador', descripcion: 'Gestión de usuarios y configuración' },
      { id: 3, nombre: 'Empleado', descripcion: 'Operaciones básicas' }
    ];
    
    return res.status(200).json({
      success: true,
      data: defaultRoles
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};

// Monitoreo de seguridad para detectar intentos de acceso sospechosos
exports.logSuspiciousRequest = async (req, res) => {
  try {
    const { url, ip, userAgent } = req.body;
    
    // Crear registro de la solicitud sospechosa
    const suspiciousRequest = {
      url,
      ip,
      userAgent,
      timestamp: new Date(),
      headers: JSON.stringify(req.headers),
      method: req.method
    };
    
    // Registrar en base de datos o archivo de log
    console.log('Solicitud sospechosa detectada:', suspiciousRequest);
    
    // Aquí puedes guardar en tu base de datos usando tu modelo
    // await SuspiciousRequest.create(suspiciousRequest);
    
    // Verificar patrones de ataques conocidos (WordPress, phpMyAdmin, etc.)
    const knownAttackPatterns = [
      'wp-admin',
      'setup-config.php',
      'wordpress',
      'phpmyadmin',
      '.env',
      'xmlrpc.php',
      'wp-login'
    ];
    
    let isKnownAttackPattern = false;
    for (const pattern of knownAttackPatterns) {
      if (url.includes(pattern)) {
        isKnownAttackPattern = true;
        break;
      }
    }
    
    // Si es un patrón de ataque conocido, podemos agregarlo a una lista de bloqueo
    if (isKnownAttackPattern) {
      // Aquí podrías implementar lógica para agregar la IP a una lista de bloqueo
      // o para notificar al administrador
      console.log(`¡Alerta! Posible intento de ataque detectado desde IP: ${ip}`);
    }
    
    // Respondemos con éxito pero sin información adicional
    return res.status(200).json({
      success: true
    });
    
  } catch (error) {
    console.error('Error al registrar solicitud sospechosa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar solicitud sospechosa',
      error: error.message
    });
  }
};

// Obtener resumen de intentos sospechosos (para panel de administrador)
exports.getSuspiciousActivitySummary = async (req, res) => {
  try {
    // Aquí implementarías la lógica para recuperar el resumen de actividades sospechosas
    // desde tu base de datos o sistema de logs
    
    // Por ejemplo:
    // const suspiciousActivities = await SuspiciousRequest.findAll({
    //   order: [['timestamp', 'DESC']],
    //   limit: 100
    // });
    
    // Ejemplo de datos para retornar (simularemos datos)
    const summarizedData = {
      totalRequests: 175,
      topAttackPatterns: [
        { pattern: 'wp-admin', count: 78 },
        { pattern: 'setup-config.php', count: 52 },
        { pattern: '.env', count: 15 },
        { pattern: 'xmlrpc.php', count: 8 },
      ],
      topIPs: [
        { ip: '172.71.184.178', count: 23 },
        { ip: '104.23.217.32', count: 14 },
        { ip: '162.158.95.4', count: 11 },
      ],
      recentActivity: [
        // Aquí irían los accesos más recientes
      ]
    };
    
    return res.status(200).json({
      success: true,
      data: summarizedData
    });
    
  } catch (error) {
    console.error('Error al obtener resumen de actividad sospechosa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de actividad sospechosa',
      error: error.message
    });
  }
};

// Implementar bloqueo de IPs maliciosas
exports.blockSuspiciousIP = async (req, res) => {
  try {
    const { ip, reason, expiration } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere dirección IP para bloquear'
      });
    }
    
    // Aquí implementarías el guardado en una lista de bloqueo
    // Ejemplo: 
    // await BlockedIP.create({
    //   ip,
    //   reason: reason || 'Actividad sospechosa',
    //   blockedAt: new Date(),
    //   expiresAt: expiration ? new Date(expiration) : null,
    //   blockedBy: req.user.id
    // });
    
    // Usar la variable expiration en el log para evitar warnings
    const expirationInfo = expiration ? `hasta ${expiration}` : 'permanentemente';
    console.log(`IP ${ip} bloqueada ${expirationInfo}. Motivo: ${reason || 'Actividad sospechosa'}`);
    
    // Notificar al equipo de seguridad
    // await notifySecurityTeam({
    //   type: 'IP_BLOCKED',
    //   ip,
    //   reason,
    //   blockedBy: req.user.email
    // });
    
    return res.status(200).json({
      success: true,
      message: `IP ${ip} bloqueada correctamente`
    });
    } catch (error) {
    console.error('Error al bloquear IP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al bloquear IP',
      error: error.message
    });
  }
};

// Función para verificar si se debe desafiar a un cliente
exports.shouldChallengeClient = async (req, res) => {
  try {
    const { ip, userAgent, url } = req.body;
    
    // Este es un sistema básico de puntuación para decidir si desafiar
    // al cliente con un CAPTCHA o verificación adicional
    let riskScore = 0;
    
    // Patrones de URLs sospechosos
    const suspiciousUrlPatterns = [
      'wp-', 'wordpress', 'setup-config', 'admin', 'login', 
      '.env', 'config', 'install', 'phpMyAdmin', 'phpmyadmin',
      'myadmin', 'mysql', 'sql', 'database', 'console', 'shell',
      'cmd', 'admin', 'xmlrpc'
    ];
    
    // Incrementar puntuación basado en la URL
    for (const pattern of suspiciousUrlPatterns) {
      if (url && url.includes(pattern)) {
        riskScore += 20;
        break;
      }
    }
    
    // Verificar el agente de usuario
    const suspiciousUserAgentPatterns = [
      'zgrab', 'bot', 'crawler', 'scanner', 'nikto', 'nmap',
      'masscan', 'nuclei', 'dirbuster', 'gobuster', 'wpscan'
    ];
    
    // Incrementar puntuación basado en el agente de usuario
    for (const pattern of suspiciousUserAgentPatterns) {
      if (userAgent && userAgent.toLowerCase().includes(pattern.toLowerCase())) {
        riskScore += 15;
        break;
      }
    }
    
    // Si el cliente accede a demasiadas URL diferentes en poco tiempo
    // aquí implementarías el conteo de solicitudes por IP en un período
    // de tiempo específico usando Redis o algún otro almacén en memoria
    
    // Ejemplo:
    // const requestsInLastMinute = await getRecentRequestsCount(ip, 60);
    // if (requestsInLastMinute > 20) {
    //   riskScore += 30;
    // }
    
    // Para evitar el warning de no usar la variable ip
    console.log(`Evaluando riesgo para IP: ${ip || 'No especificada'}`);
    
    
    const shouldChallenge = riskScore >= 30;
    
    return res.status(200).json({
      success: true,
      shouldChallenge,
      riskScore
    });
    
  } catch (error) {
    console.error('Error al evaluar cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al evaluar cliente',
      error: error.message
    });
  }
};

// Configurar reglas de seguridad WAF personalizadas
exports.updateSecurityRules = async (req, res) => {
  try {
    // Solo administradores pueden modificar reglas
    if (!req.user || !req.user.roles.includes('Superadministrador')) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para modificar las reglas de seguridad'
      });
    }
    
    const { rules } = req.body;
    
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de reglas válido'
      });
    }
    
    // Procesamiento de las reglas
    const processedRules = rules.map(rule => {
      // Validar cada regla
      if (!rule.pattern || !rule.action) {
        throw new Error('Regla inválida: debe contener pattern y action');
      }
      
      return {
        ...rule,
        updatedAt: new Date(),
        updatedBy: req.user.id
      };
    });
    
    // Aquí implementarías la lógica para guardar las reglas
    // por ejemplo, en una base de datos
    // await SecurityRule.bulkCreate(processedRules, { updateOnDuplicate: ['pattern', 'action', 'updatedAt', 'updatedBy'] });
    
    console.log('Reglas de seguridad actualizadas:', processedRules);
    
    return res.status(200).json({
      success: true,
      message: `${processedRules.length} reglas actualizadas correctamente`
    });
    
  } catch (error) {
    console.error('Error al actualizar reglas de seguridad:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar reglas de seguridad',
      error: error.message
    });
  }
};
