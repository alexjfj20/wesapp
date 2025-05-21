// Configuración de seguridad para la aplicación
module.exports = {
  // Patrones comunes de ataques para detectar
  commonAttackPatterns: [
    'wp-admin',
    'setup-config.php',
    'wordpress',
    'phpmyadmin',
    '.env',
    'xmlrpc.php',
    'wp-login',
    'admin/login',
    'administrator',
    'admin.php',
    'myadmin',
    'mysql',
    'sql',
    'database',
    'console',
    'shell',
    'cmd',
    'config'
  ],
  
  // Agentes de usuario sospechosos
  suspiciousUserAgents: [
    'zgrab',
    'bot',
    'crawler',
    'scanner',
    'nikto',
    'nmap',
    'masscan',
    'nuclei',
    'dirbuster',
    'gobuster',
    'wpscan',
    'sqlmap',
    'burp'
  ],
  
  // Reglas de seguridad predefinidas
  defaultSecurityRules: [
    {
      name: 'WordPress Admin',
      pattern: 'wp-admin',
      patternType: 'url',
      action: 'block',
      riskScore: 80,
      isRegex: false,
      isActive: true,
      description: 'Bloquea intentos de acceso a paneles de WordPress'
    },
    {
      name: 'WordPress Setup',
      pattern: 'setup-config.php',
      patternType: 'url',
      action: 'block',
      riskScore: 85,
      isRegex: false,
      isActive: true,
      description: 'Bloquea intentos de acceso a instalación de WordPress'
    },
    {
      name: 'Env File',
      pattern: '\\.env',
      patternType: 'url',
      action: 'block',
      riskScore: 90,
      isRegex: true,
      isActive: true,
      description: 'Bloquea intentos de acceso a archivos .env'
    },
    {
      name: 'PHPMyAdmin',
      pattern: 'phpmyadmin|myadmin',
      patternType: 'url',
      action: 'block',
      riskScore: 80,
      isRegex: true,
      isActive: true,
      description: 'Bloquea intentos de acceso a PHPMyAdmin'
    },
    {
      name: 'SQL Injection',
      pattern: '[\'"][\\s]*or[\\s]*[\'"]?[\\s]*\\d+[\\s]*=[\\s]*\\d+',
      patternType: 'url',
      action: 'block',
      riskScore: 95,
      isRegex: true,
      isActive: true,
      description: 'Bloquea intentos de SQL Injection'
    },
    {
      name: 'XSS Attack',
      pattern: '<script[^>]*>',
      patternType: 'url',
      action: 'block',
      riskScore: 90,
      isRegex: true,
      isActive: true,
      description: 'Bloquea intentos de Cross-Site Scripting'
    },
    {
      name: 'Scanner User Agent',
      pattern: 'zgrab|nikto|nmap|masscan|nuclei|dirbuster|gobuster|wpscan|sqlmap|burp',
      patternType: 'userAgent',
      action: 'block',
      riskScore: 85,
      isRegex: true,
      isActive: true,
      description: 'Bloquea user agents de herramientas de escaneo conocidas'
    }
  ],
  
  // Límites de tasa de solicitudes (rate limiting)
  rateLimits: {
    // Límite general para todas las rutas
    global: {
      windowMs: 60 * 1000, // 1 minuto
      max: 100, // límite a 100 solicitudes por minuto
      message: 'Demasiadas solicitudes, por favor inténtelo más tarde.'
    },
    
    // Límite específico para autenticación
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // límite a 10 intentos de login en 15 minutos
      message: 'Demasiados intentos de inicio de sesión, inténtelo más tarde.'
    }
  },
  
  // Configuración para bloqueo de IPs
  ipBlocking: {
    // Tiempo predeterminado de bloqueo en ms (48 horas)
    defaultBlockDuration: 48 * 60 * 60 * 1000,
    
    // Puntuación de riesgo que dispara bloqueo automático
    blockThreshold: 85
  }
};