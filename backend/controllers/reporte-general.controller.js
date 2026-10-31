const manejarAsync = require('../utils/async-handler');
const service = require('../services/reporte-general.service');

module.exports = {
  obtenerDashboard: manejarAsync(async (req, res) => {
    res.json({ success: true, data: await service.obtenerDashboard(req.query) });
  })
};