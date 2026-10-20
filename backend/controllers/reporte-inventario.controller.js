const manejarAsync = require('../utils/async-handler');
const reporteInventarioService = require('../services/reporte-inventario.service');

module.exports = {
  resumen: manejarAsync(async (req, res) => {
    const data = await reporteInventarioService.resumen(req.query);
    res.json({ success: true, data });
  })
};
