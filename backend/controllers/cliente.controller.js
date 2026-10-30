const manejarAsync = require('../utils/async-handler');
const clienteService = require('../services/cliente.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await clienteService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  resumen: manejarAsync(async (_req, res) => {
    const data = await clienteService.resumen();
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await clienteService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const id = await clienteService.crear(req.body);
    res.status(201).json({
      success: true,
      mensaje: 'Cliente creado correctamente',
      data: { id }
    });
  }),

  actualizar: manejarAsync(async (req, res) => {
    await clienteService.actualizar(req.params.id, req.body);
    res.json({ success: true, mensaje: 'Cliente actualizado correctamente' });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const mensaje = await clienteService.cambiarEstado(req.params.id, req.body);
    res.json({ success: true, mensaje });
  })
};
