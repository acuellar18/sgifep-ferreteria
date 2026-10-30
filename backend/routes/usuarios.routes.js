const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

// Todas las rutas del módulo exigen autenticación JWT. La lectura está
// permitida para cualquier usuario autenticado; las escrituras/borrados
// quedan restringidas por rol (administrador o superadmin).
router.use(autenticar);

// Orden importante: /reporte y /:id antes de que cualquier parámetro opaque
// una sub-ruta fija. El reporte va antes de /:id.
// Lectura administrativa: solo administrador/superadmin.
router.get('/reporte', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.reporte);
router.get('/', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.listar);
router.get('/:id', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.detalle);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.crear);
router.put('/:id', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.actualizar);
router.patch('/:id/estado', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.cambiarEstado);
router.delete('/:id', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.eliminar);

module.exports = router;