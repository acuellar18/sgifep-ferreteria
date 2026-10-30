const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { jwt: jwtConfig, ROL_ADMINISTRADOR } = require('../config/auth');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { HttpError } = require('../utils/http-error');
const usuarioRepository = require('../repositories/usuario.repository');
const rolRepository = require('../repositories/rol.repository');
const { registrarAuditoria } = require('../utils/auditoria');
const { validarPassword } = require('../utils/password');

const MAX_INTENTOS = 5;
const VENTANA_MINUTOS = 15;

// Servicio de autenticación: valida credenciales, consulta roles y emite el
// token JWT que el resto de la API exige (seguridad mediante JWT).
class AuthService {
  async autenticar({ username, password }, contexto = {}) {
    const usuarioIngresado = String(username || '').trim();
    const ip = contexto.ip || null;
    const userAgent = contexto.userAgent || null;

    if (!usuarioIngresado || !password) {
      throw new HttpError(400, 'Usuario y contraseña son requeridos');
    }

    const fallos = await this.contarFallos(usuarioIngresado, ip);
    if (fallos >= MAX_INTENTOS) {
      await this.registrarIntento(usuarioIngresado, ip, false, 'bloqueado');
      await registrarAuditoria(null, {
        username: usuarioIngresado,
        accion: 'auth.login.bloqueado',
        entidad: 'usuarios',
        descripcion: 'Inicio de sesión bloqueado por demasiados intentos fallidos',
        ip,
        userAgent
      });
      throw new HttpError(
        429,
        'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.'
      );
    }

    const usuario = await usuarioRepository.buscarConCredenciales(usuarioIngresado);
    if (!usuario) {
      await this.registrarIntento(usuarioIngresado, ip, false, 'usuario_inexistente');
      await registrarAuditoria(null, {
        username: usuarioIngresado,
        accion: 'auth.login.fallido',
        entidad: 'usuarios',
        descripcion: 'Intento de inicio de sesión con usuario inexistente',
        ip,
        userAgent
      });
      throw new HttpError(401, 'Usuario o contraseña incorrectos');
    }
    if (!usuario.activo) {
      await this.registrarIntento(usuarioIngresado, ip, false, 'usuario_inactivo');
      throw new HttpError(403, 'Este usuario está deshabilitado');
    }

    const passwordValida = await bcrypt.compare(String(password), usuario.password_hash);
    if (!passwordValida) {
      await this.registrarIntento(usuarioIngresado, ip, false, 'password_incorrecta');
      await registrarAuditoria(null, {
        usuarioId: usuario.id,
        username: usuario.username,
        accion: 'auth.login.fallido',
        entidad: 'usuarios',
        entidadId: usuario.id,
        descripcion: 'Contraseña incorrecta',
        ip,
        userAgent
      });
      throw new HttpError(401, 'Usuario o contraseña incorrectos');
    }

    await this.registrarIntento(usuarioIngresado, ip, true, null);

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

    await registrarAuditoria(null, {
      usuarioId: usuario.id,
      username: usuario.username,
      accion: 'auth.login',
      entidad: 'usuarios',
      entidadId: usuario.id,
      descripcion: 'Inicio de sesión exitoso',
      ip,
      userAgent
    });

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

  async contarFallos(username, ip) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM intentos_login
       WHERE exito = 0
         AND creado_en >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
         AND (username = ? OR ip = ?)`,
      [VENTANA_MINUTOS, username || null, ip || null]
    );
    return Number(rows[0]?.total || 0);
  }

  async registrarIntento(username, ip, exito, motivo) {
    try {
      await pool.query(
        `INSERT INTO intentos_login (username, ip, exito, motivo)
         VALUES (?, ?, ?, ?)`,
        [
          username ? String(username).slice(0, 50) : null,
          ip ? String(ip).slice(0, 45) : null,
          exito ? 1 : 0,
          motivo ? String(motivo).slice(0, 120) : null
        ]
      );
    } catch (error) {
      console.error('No se pudo registrar el intento de login:', error.message);
    }
  }

  async restablecerPassword({ username, newPassword }) {
    if (!username || !newPassword) {
      throw new HttpError(400, 'El usuario y la nueva contraseña son requeridos');
    }

    const usernameNormalizado = String(username).trim();
    validarPassword(String(newPassword), { username: usernameNormalizado });

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    const [result] = await pool.query(
      'UPDATE usuarios SET password_hash = ? WHERE username = ?',
      [passwordHash, usernameNormalizado]
    );
    if (result.affectedRows === 0) {
      throw new HttpError(404, 'El usuario ingresado no existe');
    }

    await registrarAuditoria(null, {
      username: usernameNormalizado,
      accion: 'auth.password.reset',
      entidad: 'usuarios',
      descripcion: 'Contraseña restablecida mediante el formulario público'
    });

    return true;
  }

  // ---------- Recuperación por token ----------
  async solicitarRestablecer(identificador, ip = '') {
    const crypto = require('crypto');
    const nodemailer = require('nodemailer');
    const identificadorLimpio = String(identificador).trim().toLowerCase();

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log('[DEBUG recuperación] buscando:', identificadorLimpio, '| email en usuario:', usuario ? usuario[0]?.email : 'N/A');
    }

    // Buscar por username o correo (respuesta fija, no filtra)
    let usuario;
    if (identificadorLimpio.includes('@')) {
      [usuario] = await pool.query('SELECT id, username, nombre, email FROM usuarios WHERE LOWER(email) = ? AND activo = 1 LIMIT 1', [identificadorLimpio]);
    } else {
      [usuario] = await pool.query('SELECT id, username, nombre, email FROM usuarios WHERE LOWER(username) = ? AND activo = 1 LIMIT 1', [identificadorLimpio]);
    }
    if (!usuario || !usuario.length) {
      if (process.env.NODE_ENV === 'development') console.log('[DEBUG recuperación] usuario no encontrado:', identificadorLimpio);
      return true; // no revelar ausencia
    }
    const u = usuario[0];
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG recuperación] encontrado usuario id=', u.id, 'email=', u.email || 'NO TIENE EMAIL');
    }
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const expira = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await pool.query(
      'INSERT INTO password_resets (usuario_id, token_hash, expira_en, usado) VALUES (?, ?, ?, 0)',
      [u.id, tokenHash, expira]
    );

    // Configurar nodemailer desde .env (no exponer credenciales en código)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const link = `${baseUrl}/restablecer.html?token=${tokenRaw}`;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || `SGIFEP <noreply@sgifep.local>`,
        to: u.email || `${u.username}@local`,
        subject: 'Restablecer contraseña - SGIFEP',
        html: `<p>Hola ${u.nombre || u.username},</p>
               <p>Recibiste este mensaje porque solicitaste restablecer tu contraseña.</p>
               <p><a href="${link}">Restablecer contraseña</a></p>
               <p>El enlace expira en 30 minutos y solo puede usarse una vez.</p>
               <p>Si no solicitaste esto, ignora este mensaje.</p>`
      });
    } catch (err) {
      // Log solo para diagnóstico; sin contraseñas ni tokens
      console.error('[DEBUG recuperación nodemailer] error:', err.message || err, '| code:', err.code || 'N/A');
    }
    return true;
  }

  async validarRestablecer(token, newPassword) {
    const crypto = require('crypto');
    if (!token || typeof token !== 'string') throw new HttpError(400, 'Token requerido');
    const hash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const [rows] = await pool.query(
      'SELECT usuario_id, expira_en, usado FROM password_resets WHERE token_hash = ? AND expira_en > NOW() AND usado = 0 LIMIT 1',
      [hash]
    );
    if (!rows || !rows.length) throw new HttpError(400, 'Token inválido, expirado o ya usado');

    const registro = rows[0];
    const usuarioId = registro.usuario_id;

    const { validarPassword } = require('../utils/password');
    validarPassword(String(newPassword), { username: '' });
    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [passwordHash, usuarioId]);
    await pool.query('UPDATE password_resets SET usado = 1 WHERE token_hash = ?', [hash]);

    await registrarAuditoria(null, {
      username: (await pool.query('SELECT username FROM usuarios WHERE id = ?', [usuarioId]))[0]?.[0]?.username || 'desconocido',
      accion: 'auth.password.reset_token',
      entidad: 'usuarios',
      descripcion: 'Contraseña restablecida con token seguro'
    });

    return true;
  }
}

module.exports = new AuthService();