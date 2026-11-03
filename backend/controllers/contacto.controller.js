const manejarAsync = require('../utils/async-handler');
const contactoService = require('../services/contacto.service');

module.exports = {
  recibirMensaje: manejarAsync(async (req, res) => {
    await contactoService.recibirMensaje(req.body, {
      ip: (req.headers['x-forwarded-for'] || req.socket?.address || '').toString().split(',')[0].trim()
    });
    res.json({ success: true, mensaje: '¡Mensaje enviado! Gracias por contactarnos.' });
  })
};
