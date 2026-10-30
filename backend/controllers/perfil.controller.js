const manejarAsync = require('../utils/async-handler');
const perfilService = require('../services/perfil.service');

module.exports = {
  detalle: manejarAsync(async (req, res) => {
    const data = await perfilService.detalle(req.usuario.id);
    res.json({ success: true, data });
  }),

  actualizar: manejarAsync(async (req, res) => {
    const data = await perfilService.actualizar(req.usuario.id, req.body);
    res.json({ success: true, mensaje: 'Perfil actualizado correctamente', data });
  }),

  foto: manejarAsync(async (req, res, next) => {
    const { ruta, mime } = await perfilService.obtenerFoto(req.usuario.id);
    res.set('Cache-Control', 'private, max-age=300');
    res.type(mime);
    res.sendFile(ruta, (err) => {
      if (err) next(err);
    });
  }),

  subirFoto: manejarAsync(async (req, res) => {
    const data = await perfilService.guardarFoto(req.usuario.id, req.file);
    res.status(201).json({ success: true, mensaje: 'Foto de perfil actualizada', data });
  }),

  eliminarFoto: manejarAsync(async (req, res) => {
    const data = await perfilService.eliminarFoto(req.usuario.id);
    res.json({ success: true, mensaje: 'Foto de perfil eliminada', data });
  })
};
