const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedor.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

router.use(autenticar);

router.get('/resumen', proveedorController.listarResumen);
router.get('/', proveedorController.listar);
router.get('/:id', proveedorController.detalle);
router.get('/:id/ficha', proveedorController.ficha);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), proveedorController.crear);
router.put('/:id', requerirRoles([ROL_ADMINISTRADOR]), proveedorController.actualizar);
router.patch('/:id/estado', requerirRoles([ROL_ADMINISTRADOR]), proveedorController.cambiarEstado);
router.delete('/:id', requerirRoles([ROL_ADMINISTRADOR]), proveedorController.eliminar);

module.exports = router;