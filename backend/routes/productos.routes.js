const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const {
  ROL_ADMINISTRADOR,
  ROL_COMPRAS,
  ROL_BODEGA,
  ROL_CAJA
} = require('../config/auth');

const ROLES_CONSULTA = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_BODEGA, ROL_CAJA];
const ROLES_ESCRITURA = [ROL_ADMINISTRADOR, ROL_BODEGA];
const ROLES_ELIMINAR = [ROL_ADMINISTRADOR];

router.use(autenticar);

router.get('/autocompletar', requerirRoles(ROLES_CONSULTA), productoController.autocompletar);
router.get('/categorias', requerirRoles(ROLES_CONSULTA), productoController.categorias);
router.get('/', requerirRoles(ROLES_CONSULTA), productoController.listar);
router.get('/:id', requerirRoles(ROLES_CONSULTA), productoController.detalle);

router.post('/', requerirRoles(ROLES_ESCRITURA), productoController.crear);
router.put('/:id', requerirRoles(ROLES_ESCRITURA), productoController.actualizar);
router.patch('/:id/estado', requerirRoles(ROLES_ESCRITURA), productoController.cambiarEstado);
router.delete('/:id', requerirRoles(ROLES_ELIMINAR), productoController.eliminar);

module.exports = router;
