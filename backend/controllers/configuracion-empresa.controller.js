const manejarAsync = require('../utils/async-handler');
const configuracionService = require('../services/configuracion-empresa.service');

module.exports = {
  obtener: manejarAsync(async (_req, res) => {
    const data = await configuracionService.obtener();
    res.json({ success: true, data });
  }),

  actualizar: manejarAsync(async (req, res) => {
    const data = await configuracionService.actualizar(req.body);
    res.json({ success: true, mensaje: 'Configuración actualizada correctamente', data });
  })
};
