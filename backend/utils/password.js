const { HttpError } = require('./http-error');

const COMUNES = new Set([
  '12345678',
  '123456789',
  'password',
  'password1',
  'qwerty123',
  'admin123',
  'admin1234',
  'ferreteria',
  'sgifep123',
  'contrasena',
  'contraseña'
]);

function validarPassword(password, { username = '', nombre = '' } = {}) {
  if (typeof password !== 'string' || !password) {
    throw new HttpError(400, 'La contraseña es requerida');
  }
  if (password.length < 8) {
    throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
  }
  if (password.length > 72) {
    throw new HttpError(400, 'La contraseña no puede superar los 72 caracteres');
  }
  if (!/[a-z]/.test(password)) {
    throw new HttpError(400, 'La contraseña debe incluir al menos una letra minúscula');
  }
  if (!/[A-Z]/.test(password)) {
    throw new HttpError(400, 'La contraseña debe incluir al menos una letra mayúscula');
  }
  if (!/[0-9]/.test(password)) {
    throw new HttpError(400, 'La contraseña debe incluir al menos un número');
  }
  if (COMUNES.has(password.toLowerCase())) {
    throw new HttpError(400, 'La contraseña es demasiado común; elige una más segura');
  }
  const usuario = String(username || '').trim().toLowerCase();
  if (usuario && password.toLowerCase().includes(usuario)) {
    throw new HttpError(400, 'La contraseña no debe contener el nombre de usuario');
  }
  const nombreNormalizado = String(nombre || '').trim().toLowerCase();
  if (nombreNormalizado && password.toLowerCase().includes(nombreNormalizado)) {
    throw new HttpError(400, 'La contraseña no debe contener el nombre de la persona');
  }
  return password;
}

module.exports = { validarPassword };
