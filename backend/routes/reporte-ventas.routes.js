const express = require('express');
const router = express.Router();
const controller = require('../controllers/reporte-ventas.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/resumen', requerirPermiso('facturacion.reporte.ver'), controller.resumen);
router.get('/cajeros', requerirPermiso('facturacion.reporte.ver'), controller.cajeros);

module.exports = router;
