const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { jwt: jwtConfig, ROL_ADMINISTRADOR } = require('../config/auth');
const { HttpError } = require('../utils/http-error');
const usuarioRepository = require('../repositories/usuario.repository');
const rolRepository = require('../repositories/rol.repository');

// Servicio de autenticación: valida credenciales, consulta roles y emite el
// token JWT que el resto de la API exige (seguridad mediante JWT).
class AuthService {
  async autenticar({ username, password }) {
    if (!username || !password) {
      throw new HttpError(400, 'Usuario y contraseña son requeridos');
    }

    const usuario = await usuarioRepository.buscarConCredenciales(String(username).trim());
    if (!usuario) {
      throw new HttpError(401, 'Usuario o contraseña incorrectos');
    }
    if (!usuario.activo) {
      throw new HttpError(403, 'Este usuario está deshabilitado');
    }

    const passwordValida = await bcrypt.compare(String(password), usuario.password_hash);
    if (!passwordValida) {
      throw new HttpError(401, 'Usuario o contraseña incorrectos');
    }

    const roles = await rolRepository.buscarRolesDeUsuario(usuario.id);
    const nombresRoles = roles.map((r) => r.nombre);
    const superadmin = roles.some(
      (r) => r.superadmin || r.acceso_total || r.nombre === ROL_ADMINISTRADOR
    );

    const token = jwt.sign(
      {
        sub: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        roles: nombresRoles,
        superadmin
      },
      jwtConfig.secreto,
      { expiresIn: jwtConfig.expiraEn }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol || nombresRoles[0] || 'usuario',
        roles: nombresRoles,
        superadmin
      }
    };
  }

  async restablecerPassword({ username, newPassword }) {
    if (!username || !newPassword) {
      throw new HttpError(400, 'El usuario y la nueva contraseña son requeridos');
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    const [result] = await pool.query(
      'UPDATE usuarios SET password_hash = ? WHERE username = ?',
      [passwordHash, String(username).trim()]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(404, 'El usuario ingresado no existe');
    }
    return true;
  }
}

module.exports = new AuthService();