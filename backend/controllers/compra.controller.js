const manejarAsync = require('../utils/async-handler');
const compraService = require('../services/compra.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await compraService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  resumenes: manejarAsync(async (req, res) => {
    const { data } = await compraService.resumenes(req.query);
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await compraService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const id = await compraService.crear(req.body, req.usuario.id);
    res.status(201).json({ success: true, mensaje: 'Compra registrada correctamente', data: { id } });
  }),

  anular: manejarAsync(async (req, res) => {
    await compraService.anular(req.params.id, req.usuario.id, req.body.motivo);
    res.json({ success: true, mensaje: 'Compra anulada correctamente' });
  }),

  registrarPago: manejarAsync(async (req, res) => {
    await compraService.registrarPago(req.params.id, req.body, req.usuario.id);
    res.json({ success: true, mensaje: 'Pago registrado correctamente' });
  }),

  eliminarPago: manejarAsync(async (req, res) => {
    await compraService.eliminarPago(req.params.pagoId, req.usuario.id, req.body?.motivo);
    res.json({ success: true, mensaje: 'Pago anulado correctamente' });
  })
};