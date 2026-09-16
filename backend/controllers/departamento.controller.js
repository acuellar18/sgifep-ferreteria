const manejarAsync = require('../utils/async-handler');
const departamentoService = require('../services/departamento.service');

// Controlador de DEPARTAMENTOS: capa delgada sobre el servicio.
module.exports = {
  listar: manejarAsync(async (req, res) => {
    const data = await departamentoService.listar(req.query);
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await departamentoService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const data = await departamentoService.crear(req.body);
    res.status(201).json({ success: true, data, mensaje: 'Departamento creado correctamente' });
  }),

  actualizar: manejarAsync(async (req, res) => {
    const data = await departamentoService.actualizar(req.params.id, req.body);
    res.json({ success: true, data, mensaje: 'Departamento actualizado correctamente' });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const mensaje = await departamentoService.cambiarEstado(req.params.id, req.body.activo);
    res.json({ success: true, mensaje });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await departamentoService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Departamento eliminado correctamente' });
  })
};