// Error HTTP con código de estado, usado por servicios y controladores para
// responder de forma consistente ({ success: false, mensaje }).
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = { HttpError };