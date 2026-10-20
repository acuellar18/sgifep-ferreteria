const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedor.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const {
  ROL_ADMINISTRADOR,
  ROL_COMPRAS,
  ROL_BODEGA,
  ROL_CAJA
} = require('../config/auth');

const ROLES_CONSULTA = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_BODEGA, ROL_CAJA];
const ROLES_ESCRITURA = [ROL_ADMINISTRADOR, ROL_COMPRAS];
const ROLES_ELIMINAR = [ROL_ADMINISTRADOR];

router.use(autenticar);

router.get('/resumen', requerirRoles(ROLES_CONSULTA), proveedorController.listarResumen);
router.get('/', requerirRoles(ROLES_CONSULTA), proveedorController.listar);
router.get('/:id', requerirRoles(ROLES_CONSULTA), proveedorController.detalle);
router.get('/:id/ficha', requerirRoles(ROLES_CONSULTA), proveedorController.ficha);

router.post('/', requerirRoles(ROLES_ESCRITURA), proveedorController.crear);
router.put('/:id', requerirRoles(ROLES_ESCRITURA), proveedorController.actualizar);
router.patch('/:id/estado', requerirRoles(ROLES_ESCRITURA), proveedorController.cambiarEstado);
router.delete('/:id', requerirRoles(ROLES_ELIMINAR), proveedorController.eliminar);

module.exports = router;
