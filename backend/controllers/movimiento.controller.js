const manejarAsync = require('../utils/async-handler');
const movimientoService = require('../services/movimiento.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await movimientoService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  resumen: manejarAsync(async (_req, res) => {
    const data = await movimientoService.resumen();
    res.json({ success: true, data });
  }),

  registrar: manejarAsync(async (req, res) => {
    const data = await movimientoService.registrar(req.body, req.usuario.id);
    res.status(201).json({
      success: true,
      mensaje: 'Movimiento registrado correctamente',
      data
    });
  })
};
