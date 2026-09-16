const { HttpError } = require('../utils/http-error');

// 404 para rutas inexistentes dentro de la API (respuesta JSON consistente).
function rutaNoEncontrada(_req, res) {
  res.status(404).json({ success: false, mensaje: 'Ruta no encontrada' });
}

const esProduccion = process.env.NODE_ENV === 'production';

// Middleware único de errores: normaliza HttpError y convierte cualquier otra
// excepción en un 500 JSON con el mismo contrato del resto de la API. En
// desarrollo incluye el mensaje real (detalles) para facilitar el diagnóstico.
function manejarErrores(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, mensaje: err.message });
  }
  console.error('Error no controlado:', err);
  return res.status(500).json({
    success: false,
    mensaje: 'Error interno del servidor',
    detalles: esProduccion ? undefined : err.message
  });
}

module.exports = { rutaNoEncontrada, manejarErrores };