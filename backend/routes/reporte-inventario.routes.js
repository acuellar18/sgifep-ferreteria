const express = require('express');
const router = express.Router();
const reporteInventarioController = require('../controllers/reporte-inventario.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get(
  '/resumen',
  requerirPermiso('inventario.reporte.ver'),
  reporteInventarioController.resumen
);

module.exports = router;
