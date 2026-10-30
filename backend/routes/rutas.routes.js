const express = require('express');
const router = express.Router();
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const rutaController = require('../controllers/ruta.controller');

router.use(autenticar);

router.get('/', requerirRoles(['administrador','compras','bodega','caja','ventas','reparto']), rutaController.listar);
router.get('/conductores', requerirRoles(['administrador','compras','bodega']), rutaController.listarConductores);
router.get('/vehiculos', requerirRoles(['administrador','compras','bodega']), rutaController.listarVehiculos);
router.get('/:id', requerirRoles(['administrador','compras','bodega','caja','ventas','reparto']), rutaController.detalle);
router.post('/', requerirRoles(['administrador','compras','bodega']), rutaController.crear);
router.post('/:id/iniciar', requerirRoles(['administrador','compras','bodega']), rutaController.iniciar);
router.post('/paradas/entregar', requerirRoles(['administrador','compras','bodega','caja','ventas','reparto']), rutaController.registrarEntrega);
router.post('/:id/cancelar', requerirRoles(['administrador','compras','bodega']), rutaController.cancelar);

module.exports = router;
