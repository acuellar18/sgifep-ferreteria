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
router.get('/reporte', usuarioController.reporte);
router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.detalle);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.crear);
router.put('/:id', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.actualizar);
router.patch('/:id/estado', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.cambiarEstado);
router.delete('/:id', requerirRoles([ROL_ADMINISTRADOR]), usuarioController.eliminar);

module.exports = router;