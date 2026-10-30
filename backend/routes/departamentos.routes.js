const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamento.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

// CRUD de departamentos con autenticación JWT; escrituras restringidas por rol.
router.use(autenticar);

router.get('/', requerirRoles([ROL_ADMINISTRADOR]), departamentoController.listar);
router.get('/:id', requerirRoles([ROL_ADMINISTRADOR]), departamentoController.detalle);

router.post('/', requerirRoles([ROL_ADMINISTRADOR]), departamentoController.crear);
router.put('/:id', requerirRoles([ROL_ADMINISTRADOR]), departamentoController.actualizar);
router.patch('/:id/estado', requerirRoles([ROL_ADMINISTRADOR]), departamentoController.cambiarEstado);
router.delete('/:id', requerirRoles([ROL_ADMINISTRADOR]), departamentoController.eliminar);

module.exports = router;