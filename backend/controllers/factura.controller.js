const manejarAsync = require('../utils/async-handler');
const facturaService = require('../services/factura.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await facturaService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  resumen: manejarAsync(async (req, res) => {
    const data = await facturaService.resumen();
    res.json({ success: true, data });
  }),

  productos: manejarAsync(async (req, res) => {
    const data = await facturaService.productos(req.query.q, req.query.limite);
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await facturaService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  impresion: manejarAsync(async (req, res) => {
    const data = await facturaService.impresion(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const data = await facturaService.crear(req.body, req.usuario.id);
    res.status(201).json({
      success: true,
      mensaje: 'Factura emitida correctamente',
      data
    });
  }),

  anular: manejarAsync(async (req, res) => {
    await facturaService.anular(req.params.id, req.usuario.id, req.body);
    res.json({ success: true, mensaje: 'Factura anulada correctamente' });
  })
};
