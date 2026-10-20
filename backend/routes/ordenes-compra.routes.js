const express = require('express');
const router = express.Router();
const ordenCompraController = require('../controllers/orden-compra.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const {
  ROL_ADMINISTRADOR,
  ROL_COMPRAS,
  ROL_BODEGA
} = require('../config/auth');

const ROLES_CONSULTA = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_BODEGA];
const ROLES_ESCRITURA = [ROL_ADMINISTRADOR, ROL_COMPRAS];
const ROLES_RECEPCION = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_BODEGA];

router.use(autenticar);

router.get('/stock-bajo', requerirRoles(ROLES_CONSULTA), ordenCompraController.stockBajo);
router.get('/', requerirRoles(ROLES_CONSULTA), ordenCompraController.listar);
router.get('/:id', requerirRoles(ROLES_CONSULTA), ordenCompraController.detalle);

router.post('/', requerirRoles(ROLES_ESCRITURA), ordenCompraController.crear);
router.put('/:id', requerirRoles(ROLES_ESCRITURA), ordenCompraController.actualizar);
router.post('/:id/enviar', requerirRoles(ROLES_ESCRITURA), ordenCompraController.enviar);
router.post('/:id/cancelar', requerirRoles(ROLES_ESCRITURA), ordenCompraController.cancelar);
router.post('/:id/recibir', requerirRoles(ROLES_RECEPCION), ordenCompraController.recibir);
router.delete('/:id', requerirRoles(ROLES_ESCRITURA), ordenCompraController.eliminar);

module.exports = router;
