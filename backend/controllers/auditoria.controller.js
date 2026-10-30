const manejarAsync = require('../utils/async-handler');
const auditoriaService = require('../services/auditoria.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await auditoriaService.listar(req.query);
    res.json({ success: true, data, total, page, pageSize });
  }),

  acciones: manejarAsync(async (_req, res) => {
    res.json({ success: true, data: await auditoriaService.acciones() });
  }),

  resumen: manejarAsync(async (_req, res) => {
    res.json({ success: true, data: await auditoriaService.resumen() });
  })
};
