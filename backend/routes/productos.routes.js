const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

router.use(autenticar);

router.get('/autocompletar', productoController.autocompletar);
router.get('/categorias', productoController.categorias);
router.get('/', productoController.listar);
router.get('/:id', productoController.detalle);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), productoController.crear);
router.put('/:id', requerirRoles([ROL_ADMINISTRADOR]), productoController.actualizar);
router.patch('/:id/estado', requerirRoles([ROL_ADMINISTRADOR]), productoController.cambiarEstado);
router.delete('/:id', requerirRoles([ROL_ADMINISTRADOR]), productoController.eliminar);

module.exports = router;