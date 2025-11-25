const rateLimit = require('express-rate-limit');

/**
 * Rate limiter para la API
 * 10 requests por minuto por IP
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por ventana
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter más estricto para creación de proyectos
 * 3 proyectos por hora por usuario
 */
const projectCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: { error: 'Has alcanzado el límite de creación de proyectos. Intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar username como clave si está autenticado
    return req.user?.username || req.ip;
  }
});

module.exports = {
  apiLimiter,
  projectCreationLimiter
};

