const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/resumen', requerirPermiso('facturacion.clientes.ver'), clienteController.resumen);
router.get('/', requerirPermiso('facturacion.clientes.ver'), clienteController.listar);
router.get('/:id', requerirPermiso('facturacion.clientes.ver'), clienteController.detalle);

router.post('/', requerirPermiso('facturacion.clientes.crear'), clienteController.crear);
router.put('/:id', requerirPermiso('facturacion.clientes.editar'), clienteController.actualizar);
router.patch('/:id/estado', requerirPermiso('facturacion.clientes.editar'), clienteController.cambiarEstado);

module.exports = router;
