const manejarAsync = require('../utils/async-handler');
const service = require('../services/compra-archivo.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const data = await service.listar(req.params.id);
    res.json({ success: true, data });
  }),

  subir: manejarAsync(async (req, res) => {
    const data = await service.crear(req.params.id, req.usuario.id, req.file);
    res.status(201).json({ success: true, mensaje: 'Archivo adjuntado correctamente', data });
  }),

  descargar: manejarAsync(async (req, res) => {
    const { archivo, ruta } = await service.obtenerParaDescarga(req.params.id, req.params.archivoId);
    res.download(ruta, archivo.nombre_original);
  }),

  eliminar: manejarAsync(async (req, res) => {
    await service.eliminar(req.params.id, req.params.archivoId);
    res.json({ success: true, mensaje: 'Archivo eliminado correctamente' });
  })
};
