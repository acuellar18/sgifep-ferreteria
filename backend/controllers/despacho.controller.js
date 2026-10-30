const manejarAsync = require('../utils/async-handler');
const despachoService = require('../services/despacho.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { q, estado, fechaInicio, fechaFin, clienteId, page = 1, pageSize = 20 } = req.query;
    const { data, total } = await despachoService.listar({ q, estado, fechaInicio, fechaFin, clienteId, page: Number(page), pageSize: Number(pageSize) }, req.usuario?.id);
    res.json({ success: true, data, total, page: Number(page), pageSize: Number(pageSize) });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await despachoService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const data = await despachoService.crear(req.body, req.usuario?.id);
    res.status(201).json({ success: true, mensaje: 'Despacho registrado', data });
  }),

  actualizarDatos: manejarAsync(async (req, res) => {
    const data = await despachoService.actualizarDatos(req.params.id, req.body, req.usuario?.id);
    res.json({ success: true, mensaje: 'Datos actualizados', data });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const { nuevoEstado, comentario } = req.body || {};
    const data = await despachoService.cambiarEstado(req.params.id, nuevoEstado, req.usuario?.id, comentario);
    res.json({ success: true, mensaje: 'Estado actualizado', data });
  }),

  cancelar: manejarAsync(async (req, res) => {
    const { motivo } = req.body || {};
    const data = await despachoService.cancelar(req.params.id, motivo, req.usuario?.id);
    res.json({ success: true, mensaje: 'Despacho cancelado', data });
  })
};
