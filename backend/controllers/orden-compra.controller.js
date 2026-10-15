const manejarAsync = require('../utils/async-handler');
const ordenCompraService = require('../services/orden-compra.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await ordenCompraService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await ordenCompraService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const id = await ordenCompraService.crear(req.body, req.usuario.id);
    res.status(201).json({ success: true, mensaje: 'Orden de compra creada correctamente', data: { id } });
  }),

  actualizar: manejarAsync(async (req, res) => {
    await ordenCompraService.actualizar(req.params.id, req.body, req.usuario.id);
    res.json({ success: true, mensaje: 'Orden de compra actualizada correctamente' });
  }),

  enviar: manejarAsync(async (req, res) => {
    await ordenCompraService.enviar(req.params.id, req.usuario.id);
    res.json({ success: true, mensaje: 'Orden de compra marcada como enviada' });
  }),

  cancelar: manejarAsync(async (req, res) => {
    await ordenCompraService.cancelar(req.params.id, req.usuario.id);
    res.json({ success: true, mensaje: 'Orden de compra cancelada' });
  }),

  recibir: manejarAsync(async (req, res) => {
    const { compraId, mensaje } = await ordenCompraService.recibirMercaderia(req.params.id, req.body, req.usuario.id);
    res.json({ success: true, mensaje, data: { compraId } });
  }),

  stockBajo: manejarAsync(async (req, res) => {
    const proveedorId = req.query.proveedor ? Number(req.query.proveedor) : null;
    const { data } = await ordenCompraService.stockBajo(proveedorId);
    res.json({ success: true, data });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await ordenCompraService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Orden de compra eliminada correctamente' });
  })
};