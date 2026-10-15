const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compra.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

router.use(autenticar);

router.get('/resumenes', compraController.resumenes);
router.get('/', compraController.listar);
router.get('/:id', compraController.detalle);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), compraController.crear);
router.post('/:id/anular', requerirRoles([ROL_ADMINISTRADOR]), compraController.anular);
router.post('/:id/pagos', requerirRoles([ROL_ADMINISTRADOR]), compraController.registrarPago);
router.delete('/:id/pagos/:pagoId', requerirRoles([ROL_ADMINISTRADOR]), compraController.eliminarPago);

module.exports = router;