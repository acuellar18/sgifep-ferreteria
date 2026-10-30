const manejarAsync = require('../utils/async-handler');
const cajaService = require('../services/caja.service');

module.exports = {
  obtener: manejarAsync(async (req, res) => {
    const data = await cajaService.obtener(req.usuario.id);
    res.json({ success: true, data });
  }),

  abrir: manejarAsync(async (req, res) => {
    const data = await cajaService.abrir(req.usuario.id, req.body);
    res.status(201).json({ success: true, mensaje: 'Caja abierta correctamente', data });
  }),

  cerrar: manejarAsync(async (req, res) => {
    const data = await cajaService.cerrar(req.usuario.id, req.body);
    res.json({ success: true, mensaje: 'Caja cerrada correctamente', data });
  })
};
