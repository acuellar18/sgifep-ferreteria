const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contacto.controller');

// Ruta pública: la usa el formulario de contacto de la landing page.
router.post('/contacto', contactoController.recibirMensaje);

module.exports = router;
