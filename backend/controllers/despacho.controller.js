const manejarAsync = require('../utils/async-handler');
const despachoService = require('../services/despacho.service');

function contexto(req) {
  return {
    usuarioId: req.usuario?.id,
    roles: req.usuario?.roles || [],
    superadmin: Boolean(req.usuario?.superadmin),
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
}

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { q, estado, fechaInicio, fechaFin, clienteId, responsableId, tipoVehiculo, estadoPago, page = 1, pageSize = 20 } = req.query;
    const { data, total } = await despachoService.listar(
      { q, estado, fechaInicio, fechaFin, clienteId, responsableId, tipoVehiculo, estadoPago, page: Number(page), pageSize: Number(pageSize) },
      contexto(req)
    );
    res.json({ success: true, data, total, page: Number(page), pageSize: Number(pageSize) });
  }),

  responsables: manejarAsync(async (req, res) => {
    const data = await despachoService.listarResponsables();
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await despachoService.detalle(req.params.id, contexto(req));
    res.json({ success: true, data });
  }),

  disponibles: manejarAsync(async (req, res) => {
    const data = await despachoService.disponiblesParaRuta(req.query);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const data = await despachoService.crear(req.body, contexto(req));
    res.status(201).json({ success: true, mensaje: 'Despacho registrado', data });
  }),

  actualizarDatos: manejarAsync(async (req, res) => {
    const data = await despachoService.actualizarDatos(req.params.id, req.body, contexto(req));
    res.json({ success: true, mensaje: 'Datos actualizados', data });
  }),

  asignar: manejarAsync(async (req, res) => {
    const data = await despachoService.asignar(req.params.id, req.body, contexto(req));
    res.json({ success: true, mensaje: 'Despacho asignado', data });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const { nuevoEstado, comentario } = req.body || {};
    const data = await despachoService.cambiarEstado(req.params.id, nuevoEstado, contexto(req), comentario);
    res.json({ success: true, mensaje: 'Estado actualizado', data });
  }),

  entregar: manejarAsync(async (req, res) => {
    const data = await despachoService.entregar(req.params.id, req.body, contexto(req));
    res.json({ success: true, mensaje: 'Despacho entregado', data });
  }),

  noEntregado: manejarAsync(async (req, res) => {
    const { motivo } = req.body || {};
    const data = await despachoService.marcarNoEntregado(req.params.id, motivo, contexto(req));
    res.json({ success: true, mensaje: 'Despacho marcado como no entregado', data });
  }),

  reprogramar: manejarAsync(async (req, res) => {
    const { fecha_programada } = req.body || {};
    const data = await despachoService.reprogramar(req.params.id, fecha_programada, contexto(req));
    res.json({ success: true, mensaje: 'Despacho reprogramado', data });
  }),

  cancelar: manejarAsync(async (req, res) => {
    const { motivo } = req.body || {};
    const data = await despachoService.cancelar(req.params.id, motivo, contexto(req));
    res.json({ success: true, mensaje: 'Despacho cancelado', data });
  })
};
