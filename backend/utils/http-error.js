// Error HTTP con código de estado, usado por servicios y controladores para
// responder de forma consistente ({ success: false, mensaje }).
// `datos` es opcional (p. ej. { segundos } para el contador regresivo del login).
class HttpError extends Error {
  constructor(status, message, datos = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.datos = datos;
  }
}

module.exports = { HttpError };