const manejarAsync = require('../utils/async-handler');
const imagenService = require('../services/producto-imagen.service');

module.exports = {
  subir: manejarAsync(async (req, res) => {
    const data = await imagenService.guardar(req.params.id, req.file);
    res.status(201).json({ success: true, mensaje: 'Imagen actualizada correctamente', data });
  }),

  imagen: manejarAsync(async (req, res, next) => {
    const { ruta, mime } = await imagenService.obtener(req.params.id);
    res.set('Cache-Control', 'private, max-age=3600');
    res.type(mime);
    res.sendFile(ruta, (err) => {
      if (err) next(err);
    });
  }),

  miniatura: manejarAsync(async (req, res, next) => {
    const { ruta, mime } = await imagenService.obtener(req.params.id, { miniatura: true });
    res.set('Cache-Control', 'private, max-age=3600');
    res.type(mime);
    res.sendFile(ruta, (err) => {
      if (err) next(err);
    });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await imagenService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Imagen eliminada correctamente' });
  })
};
