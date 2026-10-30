const manejarAsync = require('../utils/async-handler');
const posService = require('../services/pos.service');

module.exports = {
  contexto: manejarAsync(async (req, res) => {
    const data = await posService.contexto(req.usuario.id);
    res.json({ success: true, data });
  }),

  productoPorCodigo: manejarAsync(async (req, res) => {
    const data = await posService.buscarProducto(req.query.codigo);
    res.json({ success: true, data });
  }),

  productos: manejarAsync(async (req, res) => {
    const data = await posService.buscarProductos(req.query.q);
    res.json({ success: true, data });
  }),

  clientePorNit: manejarAsync(async (req, res) => {
    const data = await posService.buscarCliente(req.query.nit);
    res.json({ success: true, data });
  }),

  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await posService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  resumen: manejarAsync(async (req, res) => {
    const data = await posService.resumen(req.query.fecha);
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await posService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const data = await posService.crear(req.body, req.usuario.id);
    res.status(201).json({
      success: true,
      mensaje: 'Venta registrada correctamente',
      data
    });
  }),

  anular: manejarAsync(async (req, res) => {
    const data = await posService.anular(req.params.id, req.usuario.id, req.body);
    res.json({ success: true, mensaje: 'Venta anulada correctamente', data });
  }),

  cuentasPorCobrar: manejarAsync(async (_req, res) => {
    const data = await posService.cuentasPorCobrar();
    res.json({ success: true, data });
  }),

  cuenta: manejarAsync(async (req, res) => {
    const data = await posService.obtenerCuenta(req.params.id);
    res.json({ success: true, data });
  }),

  pagoCuenta: manejarAsync(async (req, res) => {
    const data = await posService.registrarPagoCuenta(
      req.params.id,
      req.body,
      req.usuario.id
    );
    res.status(201).json({
      success: true,
      mensaje: 'Pago registrado correctamente',
      data
    });
  }),

  devolucion: manejarAsync(async (req, res) => {
    const data = await posService.registrarDevolucion(
      req.params.id,
      req.body,
      req.usuario.id
    );
    res.status(201).json({
      success: true,
      mensaje: 'Devolución registrada correctamente',
      data
    });
  })
};
