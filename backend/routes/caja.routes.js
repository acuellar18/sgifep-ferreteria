const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');

const ROLES_CAJA = ['administrador', 'caja', 'ventas'];
const ROLES_OPERAR_CAJA = ['administrador', 'caja'];

router.use(autenticar, requerirRoles(ROLES_CAJA));

router.get('/', cajaController.obtener);
// Panel de control: solo el administrador ve todas las cajas abiertas.
router.get('/abiertas', requerirRoles(['administrador']), cajaController.abiertas);
// Supervisión: detalle de movimientos de una sesión de caja (solo admin).
router.get('/:id/actividad', requerirRoles(['administrador']), cajaController.actividad);
router.post('/abrir', requerirRoles(ROLES_OPERAR_CAJA), cajaController.abrir);
router.post('/cerrar', requerirRoles(ROLES_OPERAR_CAJA), cajaController.cerrar);

module.exports = router;
