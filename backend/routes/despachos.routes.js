const express = require('express');
const router = express.Router();
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const despachoController = require('../controllers/despacho.controller');

router.use(autenticar);

router.get('/', requerirRoles(['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto']), despachoController.listar);
router.get('/:id', requerirRoles(['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto']), despachoController.detalle);
router.post('/', requerirRoles(['administrador', 'compras', 'bodega']), despachoController.crear);
router.put('/:id', requerirRoles(['administrador', 'compras', 'bodega']), despachoController.actualizarDatos);
router.post('/:id/estado', requerirRoles(['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto']), despachoController.cambiarEstado);
router.post('/:id/cancelar', requerirRoles(['administrador', 'compras', 'bodega']), despachoController.cancelar);

module.exports = router;
