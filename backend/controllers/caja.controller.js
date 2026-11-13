const manejarAsync = require('../utils/async-handler');
const cajaService = require('../services/caja.service');
const { HttpError } = require('../utils/http-error');

module.exports = {
  obtener: manejarAsync(async (req, res) => {
    const data = await cajaService.obtener(req.usuario.id, req.query);
    res.json({ success: true, data });
  }),

  abiertas: manejarAsync(async (req, res) => {
    const data = await cajaService.abiertas();
    res.json({ success: true, data });
  }),

  actividad: manejarAsync(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, 'El identificador de caja no es válido');
    }
    const data = await cajaService.actividad(id);
    res.json({ success: true, data });
  }),

  abrir: manejarAsync(async (req, res) => {
    const data = await cajaService.abrir(req.usuario.id, req.body, req.query);
    res.status(201).json({ success: true, mensaje: 'Caja abierta correctamente', data });
  }),

  cerrar: manejarAsync(async (req, res) => {
    const data = await cajaService.cerrar(req.usuario.id, req.body, req.query);
    res.json({ success: true, mensaje: 'Caja cerrada correctamente', data });
  })
};
