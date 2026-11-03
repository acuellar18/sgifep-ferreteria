const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Endpoints públicos de autenticación.
router.post('/login', authController.login);

// Registro público (cuenta queda inactiva hasta que un administrador la active)
router.post('/registro', authController.registrarse);

// Solicitar restablecimiento (respuesta siempre indiferente para no revelar usuarios)
router.post('/reset-password/solicitar', authController.solicitarRestablecer);

// Validar token + actualizar contraseña (token de un uso, 30 min)
router.post('/reset-password/validar', authController.validarRestablecer);

module.exports = router;
