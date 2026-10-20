const manejarAsync = require('../utils/async-handler');
const categoriaService = require('../services/categoria.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await categoriaService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await categoriaService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const id = await categoriaService.crear(req.body);
    res.status(201).json({
      success: true,
      mensaje: 'Categoría creada correctamente',
      data: { id }
    });
  }),

  actualizar: manejarAsync(async (req, res) => {
    await categoriaService.actualizar(req.params.id, req.body);
    res.json({ success: true, mensaje: 'Categoría actualizada correctamente' });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const mensaje = await categoriaService.cambiarEstado(req.params.id, req.body.activo);
    res.json({ success: true, mensaje });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await categoriaService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Categoría eliminada correctamente' });
  })
};
