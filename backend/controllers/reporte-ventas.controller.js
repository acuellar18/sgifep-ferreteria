const manejarAsync = require('../utils/async-handler');
const reporteService = require('../services/reporte-ventas.service');

module.exports = {
  resumen: manejarAsync(async (req, res) => {
    res.json({ success: true, data: await reporteService.resumen(req.query) });
  }),

  cajeros: manejarAsync(async (_req, res) => {
    res.json({ success: true, data: await reporteService.cajeros() });
  })
};
