const manejarAsync = require('../utils/async-handler');
const usuarioService = require('../services/usuario.service');

// Controlador de USUARIOS: capa delgada. Lee petición, llama al servicio y
// responde JSON con el contrato { success, data|mensaje }.
module.exports = {
  listar: manejarAsync(async (req, res) => {
    const data = await usuarioService.listar(req.query);
    res.json({ success: true, data });
  }),

  reporte: manejarAsync(async (_req, res) => {
    const data = await usuarioService.reporte();
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await usuarioService.detalle(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const id = await usuarioService.crear(req.body);
    res.status(201).json({ success: true, mensaje: 'Usuario creado correctamente', data: { id } });
  }),

  actualizar: manejarAsync(async (req, res) => {
    await usuarioService.actualizar(req.params.id, req.body);
    res.json({ success: true, mensaje: 'Usuario actualizado correctamente' });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const mensaje = await usuarioService.cambiarEstado(req.params.id, req.body.activo);
    res.json({ success: true, mensaje });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await usuarioService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Usuario eliminado correctamente' });
  })
};