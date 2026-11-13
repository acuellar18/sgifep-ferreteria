const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');

// La auditoría es exclusiva del rol administrador (los superadmins conservan
// acceso total). No basta con el permiso granular: aunque se asigne a otro
// rol, el endpoint seguirá bloqueado.
router.use(autenticar, requerirRoles(['administrador']));

router.get('/resumen', auditoriaController.resumen);
router.get('/acciones', auditoriaController.acciones);
router.get('/', auditoriaController.listar);

module.exports = router;
