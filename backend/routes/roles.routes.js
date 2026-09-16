const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rol.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

// CRUD de roles con autenticación JWT; escrituras restringidas por rol.
router.use(autenticar);

router.get('/', rolController.listar);
router.get('/:id', rolController.detalle);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), rolController.crear);
router.put('/:id', requerirRoles([ROL_ADMINISTRADOR]), rolController.actualizar);
router.patch('/:id/estado', requerirRoles([ROL_ADMINISTRADOR]), rolController.cambiarEstado);
router.delete('/:id', requerirRoles([ROL_ADMINISTRADOR]), rolController.eliminar);

module.exports = router;