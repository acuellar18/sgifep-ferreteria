const express = require('express');
const router = express.Router();
const controller = require('../controllers/reporte-general.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/general', requerirPermiso('reportes.general.ver'), controller.obtenerDashboard);

module.exports = router;