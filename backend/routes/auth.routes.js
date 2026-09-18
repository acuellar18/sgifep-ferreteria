const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Endpoints públicos de autenticación (login y restablecer contraseña).
// Son el único punto que NO exige token: /api/login emite el JWT.
//
// NOTA DE DISEÑO — Sin auto-registro de usuarios:
// SGIFEP es un sistema interno (empleados de la ferretería), no un producto
// de cara al público. Por eso NO existe un endpoint de registro abierto:
// las cuentas solo las crea un administrador desde el módulo de Usuarios
// (POST /api/usuarios, protegido por requerirRoles([ROL_ADMINISTRADOR])).
// Esto es intencional, no un pendiente: permitir que cualquiera se registre
// solo, sin pasar por un admin, rompería el control de acceso por rol y
// departamento que es la base de todo el sistema.
router.post('/login', authController.login);
router.post('/reset-password', authController.restablecerPassword);

module.exports = router;