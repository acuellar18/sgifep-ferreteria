const manejarAsync = require('../utils/async-handler');
const service = require('../services/compra-comentario.service');

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const data = await service.listar(req.params.id);
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const data = await service.crear(req.params.id, req.usuario.id, req.body?.comentario);
    res.status(201).json({ success: true, mensaje: 'Comentario agregado', data });
  })
};
