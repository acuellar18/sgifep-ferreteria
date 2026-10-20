const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compra.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const {
  ROL_ADMINISTRADOR,
  ROL_COMPRAS,
  ROL_BODEGA,
  ROL_CAJA
} = require('../config/auth');

const ROLES_CONSULTA = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_BODEGA, ROL_CAJA];
const ROLES_ESCRITURA = [ROL_ADMINISTRADOR, ROL_COMPRAS];
const ROLES_PAGOS = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_CAJA];
const ROLES_ANULACION = [ROL_ADMINISTRADOR];

router.use(autenticar);

router.get('/resumenes', requerirRoles(ROLES_CONSULTA), compraController.resumenes);
router.get('/', requerirRoles(ROLES_CONSULTA), compraController.listar);
router.get('/:id', requerirRoles(ROLES_CONSULTA), compraController.detalle);

router.post('/', requerirRoles(ROLES_ESCRITURA), compraController.crear);
router.post('/:id/anular', requerirRoles(ROLES_ANULACION), compraController.anular);
router.post('/:id/pagos', requerirRoles(ROLES_PAGOS), compraController.registrarPago);
router.delete('/:id/pagos/:pagoId', requerirRoles(ROLES_ANULACION), compraController.eliminarPago);

module.exports = router;
