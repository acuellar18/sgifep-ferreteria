const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/resumen', requerirPermiso('seguridad.auditoria.ver'), auditoriaController.resumen);
router.get('/acciones', requerirPermiso('seguridad.auditoria.ver'), auditoriaController.acciones);
router.get('/', requerirPermiso('seguridad.auditoria.ver'), auditoriaController.listar);

module.exports = router;
