const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimiento.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/resumen', requerirPermiso('inventario.movimientos.ver'), movimientoController.resumen);
router.get('/', requerirPermiso('inventario.movimientos.ver'), movimientoController.listar);
router.post('/', requerirPermiso('inventario.movimientos.ajustar'), movimientoController.registrar);

module.exports = router;
