const manejarAsync = require('../utils/async-handler');
const authService = require('../services/auth.service');

// Controlador de autenticación: expone login y restablecer contraseña.
// Mantiene el contrato legacy de /api/login (compatible con login.html) pero
// ahora también devuelve el token JWT para el resto de la API.
module.exports = {
  login: manejarAsync(async (req, res) => {
    const data = await authService.autenticar(req.body);
    res.json({ success: true, ...data });
  }),

  restablecerPassword: manejarAsync(async (req, res) => {
    await authService.restablecerPassword(req.body);
    res.json({ success: true, mensaje: 'Contraseña actualizada correctamente' });
  })
};