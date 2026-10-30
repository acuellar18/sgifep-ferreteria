const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');

const ROLES_CAJA = ['administrador', 'caja', 'ventas'];
const ROLES_OPERAR_CAJA = ['administrador', 'caja'];

router.use(autenticar, requerirRoles(ROLES_CAJA));

router.get('/', cajaController.obtener);
router.post('/abrir', requerirRoles(ROLES_OPERAR_CAJA), cajaController.abrir);
router.post('/cerrar', requerirRoles(ROLES_OPERAR_CAJA), cajaController.cerrar);

module.exports = router;
