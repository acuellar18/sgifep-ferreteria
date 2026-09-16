const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Endpoints públicos de autenticación (login y restablecer contraseña).
// Son el único punto que NO exige token: /api/login emite el JWT.
router.post('/login', authController.login);
router.post('/reset-password', authController.restablecerPassword);

module.exports = router;