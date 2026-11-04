const manejarAsync = require('../utils/async-handler');
const authService = require('../services/auth.service');

const MILIS_HORA = 60 * 60 * 1000;
const MAX_SOLICITUDES_RESET_POR_HORA = 5; // límite por IP y por usuario
const MAX_VALIDACIONES_RESET_POR_HORA = 20; // defensa extra sobre el canje de tokens

// Rate limit en memoria (por proceso). Para 5/h por IP+usuario este alcance basta;
// el bloqueo de fuerza bruta del login sí vive en la base de datos.
function crearVentana() {
  return {
    intentos: global.__resetRateLimit || (global.__resetRateLimit = {}),
    ahora: Date.now()
  };
}

function limitar(clave, maxPorHora, estado) {
  const historial = (estado.intentos[clave] || []).filter((t) => estado.ahora - t < MILIS_HORA);
  if (historial.length >= maxPorHora) {
    // Segundos hasta que caduca el intento más viejo de la ventana.
    const segundos = Math.max(60, Math.ceil((MILIS_HORA - (estado.ahora - historial[0])) / 1000));
    return { bloqueado: true, segundos };
  }
  historial.push(estado.ahora);
  estado.intentos[clave] = historial;
  return { bloqueado: false };
}

module.exports = {
  login: manejarAsync(async (req, res) => {
    const data = await authService.autenticar(req.body, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    res.json({ success: true, ...data });
  }),

  // Registro público: mesas de trabajo limitadas por IP (5 solicitudes/hora)
  registrarse: manejarAsync(async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const limitMs = 60 * 60 * 1000;
    const maxIntents = 5;
    const key = 'registro:' + ip;
    const attempts = (global.__registroRateLimit = global.__registroRateLimit || {});
    const history = (attempts[key] || []).filter(t => now - t < limitMs);
    if (history.length >= maxIntents) {
      return res.status(429).json({ success: false, mensaje: 'Demasiadas solicitudes. Intenta más tarde.' });
    }
    history.push(now);
    attempts[key] = history;

    const data = await authService.registrarse(req.body, {
      ip,
      userAgent: req.get('user-agent')
    });
    res.status(201).json({
      success: true,
      mensaje: '✅ Solicitud enviada. Tu cuenta quedará activa cuando un administrador la habilite.',
      data
    });
  }),

  // Solicitud de restablecimiento (usuario + correo).
  // Anti-enumeración: SIEMPRE responde 200 con el mismo texto, exista o no el
  // usuario; el procesamiento (BD + correo) corre en segundo plano para que el
  // tiempo de respuesta no delate casos válidos. Nunca se devuelve el enlace.
  solicitarRestablecer: manejarAsync(async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const estado = crearVentana();
    const usuarioIngresado = String(req.body?.usuario || req.body?.email || '').trim().toLowerCase();
    const correoIngresado = String(req.body?.correo || req.body?.email || '').trim().toLowerCase();

    // Límite 5/h por IP y 5/h por combinación usuario+correo (cada clave cuenta aparte).
    const porIp = limitar(`reset-ip:${ip}`, MAX_SOLICITUDES_RESET_POR_HORA, estado);
    const porDatos = limitar(
      `reset-datos:${ip}:${usuarioIngresado}:${correoIngresado}`,
      MAX_SOLICITUDES_RESET_POR_HORA,
      estado
    );
    if (porIp.bloqueado || porDatos.bloqueado) {
      const segundos = Math.max(porIp.segundos || 60, porDatos.segundos || 60);
      return res.status(429).json({
        success: false,
        mensaje: `Demasiadas solicitudes. Intenta de nuevo en ${Math.ceil(segundos / 60)} minutos.`,
        datos: { segundos }
      });
    }

    if (!usuarioIngresado || !correoIngresado) {
      // Mismo mensaje genérico con 200: no se revela qué faltó.
      return res.json({
        success: true,
        mensaje: 'Si los datos son correctos, te enviaremos un enlace al correo registrado.'
      });
    }

    // El envío no participa de la respuesta: tiempo constante y sin filtrar errores.
    setImmediate(() => {
      authService
        .solicitarRestablecer({ usuario: usuarioIngresado, correo: correoIngresado }, { ip })
        .catch((err) => console.error('[reset] error enviando enlace:', err.message || err));
    });

    return res.json({
      success: true,
      mensaje: 'Si los datos son correctos, te enviaremos un enlace al correo registrado.'
    });
  }),

  // Canje del token y nueva contraseña (validado en el servicio).
  validarRestablecer: manejarAsync(async (req, res) => {
    const { token, newPassword } = req.body || {};
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, mensaje: 'Token y nueva contraseña son requeridos' });
    }

    // Poco urgente (token de 256 bits), pero acota el volumen de consultas por IP.
    const estado = crearVentana();
    const limite = limitar(`reset-validar:${ip}`, MAX_VALIDACIONES_RESET_POR_HORA, estado);
    if (limite.bloqueado) {
      const segundos = Math.max(60, limite.segundos);
      return res.status(429).json({
        success: false,
        mensaje: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(segundos / 60)} minutos.`,
        datos: { segundos }
      });
    }

    const data = await authService.validarRestablecer(String(token).trim(), String(newPassword), { ip });
    res.json({
      success: true,
      mensaje: 'Contraseña restablecida correctamente y sesiones previas cerradas',
      ...data
    });
  })
};
