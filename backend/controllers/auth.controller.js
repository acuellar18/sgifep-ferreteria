const manejarAsync = require('../utils/async-handler');
const authService = require('../services/auth.service');

module.exports = {
  login: manejarAsync(async (req, res) => {
    const data = await authService.autenticar(req.body, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    res.json({ success: true, ...data });
  }),

  // Rate limit simple por IP para recuperación (3 intentos / 15 min)
  solicitarRestablecer: manejarAsync(async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const limitMs = 15 * 60 * 1000;
    const maxIntents = 3;
    const key = ip + ':' + (req.body?.usuario || req.body?.email || '');
    const attempts = (global.__resetRateLimit = global.__resetRateLimit || {});
    const history = attempts[key] || [];
    const recent = history.filter(t => now - t < limitMs);
    if (recent.length >= maxIntents) {
      return res.status(429).json({ success: false, mensaje: 'Demasiados intentos. Intenta más tarde.' });
    }
    recent.push(now);
    attempts[key] = recent;

    const identificador = req.body?.usuario || req.body?.email || '';
    if (!identificador || typeof identificador !== 'string') {
      return res.status(400).json({ success: false, mensaje: 'Proporciona usuario o correo' });
    }
    try {
      await authService.solicitarRestablecer(identificador.trim(), ip);
    } catch (_) { /* ignorar errores internos para no filtrar */ }
    return res.json({ success: true, mensaje: 'Si el correo existe, recibirás instrucciones' });
  }),

  validarRestablecer: manejarAsync(async (req, res) => {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, mensaje: 'Token y nueva contraseña son requeridos' });
    }
    const data = await authService.validarRestablecer(token.trim(), String(newPassword).trim());
    res.json({ success: true, mensaje: 'Contraseña restablecida correctamente', ...data });
  })
};
