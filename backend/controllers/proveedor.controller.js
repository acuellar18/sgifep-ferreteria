const manejarAsync = require('../utils/async-handler');
const proveedorService = require('../services/proveedor.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await proveedorService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  listarResumen: manejarAsync(async (req, res) => {
    const { data } = await proveedorService.listarResumen(req.query);
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await proveedorService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  ficha: manejarAsync(async (req, res) => {
    const data = await proveedorService.ficha(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const id = await proveedorService.crear(req.body);
    res.status(201).json({ success: true, mensaje: 'Proveedor creado correctamente', data: { id } });
  }),

  actualizar: manejarAsync(async (req, res) => {
    await proveedorService.actualizar(req.params.id, req.body);
    res.json({ success: true, mensaje: 'Proveedor actualizado correctamente' });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const mensaje = await proveedorService.cambiarEstado(req.params.id, req.body.activo);
    res.json({ success: true, mensaje });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await proveedorService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Proveedor eliminado correctamente' });
  })
};