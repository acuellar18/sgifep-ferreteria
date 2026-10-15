const manejarAsync = require('../utils/async-handler');
const reporteCompraService = require('../services/reporte-compra.service');

module.exports = {
  resumen: manejarAsync(async (req, res) => {
    const { data } = await reporteCompraService.resumen(req.query);
    res.json({ success: true, data });
  }),

  comprasPorMes: manejarAsync(async (req, res) => {
    const { data } = await reporteCompraService.comprasPorMes(req.query);
    res.json({ success: true, data });
  }),

  topProveedores: manejarAsync(async (req, res) => {
    const limite = Math.min(Number(req.query.limite) || 5, 20);
    const { data } = await reporteCompraService.topProveedores(req.query, limite);
    res.json({ success: true, data });
  }),

  productosMasComprados: manejarAsync(async (req, res) => {
    const limite = Math.min(Number(req.query.limite) || 10, 50);
    const { data } = await reporteCompraService.productosMasComprados(req.query, limite);
    res.json({ success: true, data });
  }),

  variacionCosto: manejarAsync(async (req, res) => {
    const { data } = await reporteCompraService.variacionCosto(req.params.productoId, req.query);
    res.json({ success: true, data });
  }),

  cuentasPorPagar: manejarAsync(async (req, res) => {
    const { data } = await reporteCompraService.cuentasPorPagar(req.query);
    res.json({ success: true, data });
  }),

  categorias: manejarAsync(async (req, res) => {
    const { data } = await reporteCompraService.categorias();
    res.json({ success: true, data });
  })
};