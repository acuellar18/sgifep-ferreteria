const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');
const { subirFotoPerfil } = require('../middlewares/upload-perfil.middleware');
const { autenticar } = require('../middlewares/auth.middleware');

router.use(autenticar);

router.get('/foto', perfilController.foto);
router.post('/foto', subirFotoPerfil, perfilController.subirFoto);
router.delete('/foto', perfilController.eliminarFoto);
router.get('/', perfilController.detalle);
router.put('/', perfilController.actualizar);

module.exports = router;
