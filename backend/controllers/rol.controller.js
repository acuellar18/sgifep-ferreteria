const manejarAsync = require('../utils/async-handler');
const rolService = require('../services/rol.service');

// Controlador de ROLES: capa delgada sobre el servicio.
module.exports = {
  listar: manejarAsync(async (req, res) => {
    const data = await rolService.listar(req.query);
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await rolService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const data = await rolService.crear(req.body);
    res.status(201).json({ success: true, data, mensaje: 'Rol creado correctamente' });
  }),

  actualizar: manejarAsync(async (req, res) => {
    const data = await rolService.actualizar(req.params.id, req.body);
    res.json({ success: true, data, mensaje: 'Rol actualizado correctamente' });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const mensaje = await rolService.cambiarEstado(req.params.id, req.body.activo);
    res.json({ success: true, mensaje });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await rolService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Rol eliminado correctamente' });
  })
};