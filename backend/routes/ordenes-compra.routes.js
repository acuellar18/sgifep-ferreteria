const express = require('express');
const router = express.Router();
const ordenCompraController = require('../controllers/orden-compra.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

router.use(autenticar);

router.get('/stock-bajo', ordenCompraController.stockBajo);
router.get('/', ordenCompraController.listar);
router.get('/:id', ordenCompraController.detalle);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), ordenCompraController.crear);
router.put('/:id', requerirRoles([ROL_ADMINISTRADOR]), ordenCompraController.actualizar);
router.post('/:id/enviar', requerirRoles([ROL_ADMINISTRADOR]), ordenCompraController.enviar);
router.post('/:id/cancelar', requerirRoles([ROL_ADMINISTRADOR]), ordenCompraController.cancelar);
router.post('/:id/recibir', requerirRoles([ROL_ADMINISTRADOR]), ordenCompraController.recibir);
router.delete('/:id', requerirRoles([ROL_ADMINISTRADOR]), ordenCompraController.eliminar);

module.exports = router;