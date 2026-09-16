// Envuelve controladores asincrónicos: cualquier rechazo se entrega al
// middleware de errores en lugar de propagarse como promesa sin manejar.
const manejarAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = manejarAsync;