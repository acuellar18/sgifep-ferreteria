const express = require('express');
const router = express.Router();
const controller = require('../controllers/configuracion-empresa.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const { ROL_ADMINISTRADOR } = require('../config/auth');

router.use(autenticar);

router.get('/', controller.obtener);
router.put('/', requerirRoles([ROL_ADMINISTRADOR]), controller.actualizar);

module.exports = router;
