const manejarAsync = require('../utils/async-handler');
const rutaService = require('../services/ruta.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { fechaInicio, fechaFin, conductorId, vehiculoId, estado, page = 1, pageSize = 20 } = req.query;
    const { data, total } = await rutaService.listar({ fechaInicio, fechaFin, conductorId, vehiculoId, estado, page: Number(page), pageSize: Number(pageSize) });
    res.json({ success: true, data, total, page: Number(page), pageSize: Number(pageSize) });
  }),
  detalle: manejarAsync(async (req, res) => {
    const data = await rutaService.detalle(req.params.id);
    res.json({ success: true, data });
  }),
  crear: manejarAsync(async (req, res) => {
    const data = await rutaService.crear(req.body, req.usuario?.id);
    res.status(201).json({ success: true, mensaje: 'Ruta creada', data });
  }),
  iniciar: manejarAsync(async (req, res) => {
    const data = await rutaService.iniciar(req.params.id, req.usuario?.id);
    res.json({ success: true, mensaje: 'Ruta iniciada', data });
  }),
  registrarEntrega: manejarAsync(async (req, res) => {
    const { paradaId, resultado, horaEntrega, recibidoPor, observaciones, motivoFallo } = req.body || {};
    const data = await rutaService.registrarEntrega(req.params.paradaId || paradaId, resultado, horaEntrega, recibidoPor, observaciones, motivoFallo, req.usuario?.id);
    res.json({ success: true, mensaje: 'Entrega registrada', data });
  }),
  cancelar: manejarAsync(async (req, res) => {
    const data = await rutaService.cancelar(req.params.id, req.body?.motivo, req.usuario?.id);
    res.json({ success: true, mensaje: 'Ruta cancelada', data });
  }),
  listarConductores: manejarAsync(async (req, res) => {
    res.json({ success: true, data: await rutaService.listarConductores(req.query) });
  }),
  listarVehiculos: manejarAsync(async (req, res) => {
    res.json({ success: true, data: await rutaService.listarVehiculos(req.query) });
  })
};
