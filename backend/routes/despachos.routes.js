const express = require('express');
const router = express.Router();
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const despachoController = require('../controllers/despacho.controller');

router.use(autenticar);

// Consulta (todos los roles de operación; reparto ve solo los suyos en el servicio)
const ROLES_VER = ['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto'];
// Gestión total: administrador y encargado de despacho (bodega)
const ROLES_GESTION = ['administrador', 'bodega'];
// Cambios de estado que puede hacer también el repartidor (solo en los suyos)
const ROLES_ESTADO = ['administrador', 'bodega', 'reparto'];

router.get('/', requerirRoles(ROLES_VER), despachoController.listar);
router.get('/responsables', requerirRoles(ROLES_GESTION), despachoController.responsables);
router.get('/disponibles', requerirRoles(ROLES_VER), despachoController.disponibles);
router.get('/:id', requerirRoles(ROLES_VER), despachoController.detalle);
router.post('/', requerirRoles(ROLES_GESTION), despachoController.crear);
router.put('/:id', requerirRoles(ROLES_GESTION), despachoController.actualizarDatos);
router.post('/:id/asignar', requerirRoles(ROLES_GESTION), despachoController.asignar);
router.post('/:id/estado', requerirRoles(ROLES_ESTADO), despachoController.cambiarEstado);
router.post('/:id/entregar', requerirRoles(ROLES_ESTADO), despachoController.entregar);
router.post('/:id/no-entregado', requerirRoles(ROLES_ESTADO), despachoController.noEntregado);
router.post('/:id/reprogramar', requerirRoles(ROLES_GESTION), despachoController.reprogramar);
router.post('/:id/cancelar', requerirRoles(ROLES_GESTION), despachoController.cancelar);

module.exports = router;
