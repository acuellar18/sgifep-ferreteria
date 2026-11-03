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

// Logo embebido (CID) para las plantillas de correo.
const adjuntoLogo = {
  filename: 'logo.png',
  path: path.join(__dirname, '..', 'public', 'img', 'logo.png'),
  cid: 'logo-ferreteria'
};

// Encabezado antracita con el logo a la izquierda y el título a la derecha.
function encabezadoCorreo(titulo, subtitulo) {
  return `<td style="background-color:#141414; padding:18px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle; width:60px;">
                    <img src="cid:logo-ferreteria" alt="Ferretería El Puente" style="display:block; width:48px; height:48px; border:0;">
                  </td>
                  <td style="vertical-align:middle; text-align:right;">
                    <p style="margin:0; color:#ffffff; font-size:15px; font-weight:bold;">${titulo}</p>
                    <p style="margin:4px 0 0; color:#16a34a; font-size:12px; text-transform:uppercase; letter-spacing:1px;">${subtitulo}</p>
                  </td>
                </tr>
              </table>
            </td>`;
}

function escaparHtml(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
      throw new HttpError(403, 'Cuenta inactiva. Un administrador debe habilitar tu acceso antes de poder ingresar.');
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

  // ---------- Registro público (cuenta pendiente de activación) ----------
  async registrarse(datos, contexto = {}) {
    const usuarioDto = require('../dtos/usuario.dto');
    const dto = usuarioDto.validarRegistroPublico(datos);

    if (await usuarioRepository.buscarPorUsername(dto.username)) {
      throw new HttpError(409, 'Ya existe una cuenta con ese nombre de usuario');
    }
    if (await usuarioRepository.buscarPorEmail(dto.email)) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const connection = await pool.getConnection();
    let nuevoId;
    try {
      await connection.beginTransaction();
      nuevoId = await usuarioRepository.crear(connection, {
        nombre: dto.nombre,
        apellido: dto.apellido,
        codigo: null, // el administrador le asigna código al activar la cuenta
        username: dto.username,
        password_hash: passwordHash,
        rol: 'pendiente',
        departamento_id: null,
        activo: 0, // lanzará 403 en login hasta que un administrador lo active
        email: dto.email
      });
      // Sin roles: quedan sin acceso hasta que el administrador asigne.
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'El usuario o correo ya están en uso');
      }
      throw err;
    } finally {
      connection.release();
    }

    await registrarAuditoria(null, {
      username: dto.username,
      accion: 'auth.registro.publico',
      entidad: 'usuarios',
      entidadId: nuevoId,
      descripcion: 'Solicitud de registro público (cuenta creada inactiva y sin roles)',
      ip: contexto.ip,
      userAgent: contexto.userAgent
    });

    this.notificarNuevaSolicitud(dto).catch(() => {});
    return { username: dto.username, pendiente: true };
  }

  // Aviso al correo de la ferretería: hay una solicitud pendiente de activar.
  async notificarNuevaSolicitud(dto) {
    try {
      const nodemailer = require('nodemailer');
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      if (!user || !pass) return;

      const port = Number(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      const para = process.env.CONTACTO_EMAIL || user;
      const remitente = process.env.MAIL_FROM || `Sistema SGIFEP <${user}>`;
      const nombres = [dto.nombre, dto.apellido].filter(Boolean).join(' ');
      const link = `https://mail.google.com`;

      await transporter.sendMail({
        from: remitente,
        to: para,
        replyTo: dto.email,
        subject: `Solicitud de acceso al sistema: ${dto.username}`,
        text: [
          'Nueva solicitud de registro en el sistema SGIFEP.',
          `Nombre: ${nombres}`,
          `Usuario: ${dto.username}`,
          `Correo: ${dto.email}`,
          '',
          'La cuenta quedó creada pero INACTIVA. Apruébala desde el módulo Usuarios:',
          'actívala, asignale código, departamento y roles antes de su primer ingreso.'
        ].join('\n'),
        html: `<div style="margin:0; padding:24px; background-color:#f4f4f5; font-family:Arial,Helvetica,sans-serif;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
                   <tr>
                     ${encabezadoCorreo('SISTEMA SGIFEP', 'Nueva solicitud de acceso')}
                   </tr>
                   <tr>
                     <td style="padding:28px; font-size:14px; color:#27272a;">
                       <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                         <tr><td style="padding:8px 0; color:#71717a; width:90px;">Nombre</td><td style="padding:8px 0; font-weight:bold;">${escaparHtml(nombres)}</td></tr>
                         <tr><td style="padding:8px 0; color:#71717a;">Usuario</td><td style="padding:8px 0; font-weight:bold;">${escaparHtml(dto.username)}</td></tr>
                         <tr><td style="padding:8px 0; color:#71717a;">Correo</td><td style="padding:8px 0; font-weight:bold;">${escaparHtml(dto.email)}</td></tr>
                       </table>
                       <div style="margin:18px 0 0; padding:16px 18px; background-color:#e7f6ec; border-left:4px solid #16a34a; border-radius:6px;">
                         La cuenta quedó creada pero <strong>INACTIVA</strong>. Apruébala desde el módulo
                         <strong>Usuarios</strong>: actívala y asignale código, departamento y roles antes de su primer ingreso.
                       </div>
                     </td>
                   </tr>
                   <tr>
                     <td style="padding:14px 28px; background-color:#faf7f2; border-top:1px solid #e4e4e7;">
                       <p style="margin:0; font-size:11px; color:#a1a1aa;">Aviso automático del formulario de registro (login SGIFEP)</p>
                     </td>
                   </tr>
                 </table>
                </div>`,
        attachments: [adjuntoLogo]
      });
    } catch (err) {
      console.error('[registro] error enviando aviso al administrador:', err.message || err);
    }
  }

  // ---------- Recuperación por token ----------
  async solicitarRestablecer(identificador, ip = '') {
    const crypto = require('crypto');
    const nodemailer = require('nodemailer');
    const identificadorLimpio = String(identificador).trim().toLowerCase();

    // Buscar por username o correo (respuesta fija, no filtra)
    let usuario;
    if (identificadorLimpio.includes('@')) {
      [usuario] = await pool.query('SELECT id, username, nombre, email FROM usuarios WHERE LOWER(email) = ? AND activo = 1 LIMIT 1', [identificadorLimpio]);
    } else {
      [usuario] = await pool.query('SELECT id, username, nombre, email FROM usuarios WHERE LOWER(username) = ? AND activo = 1 LIMIT 1', [identificadorLimpio]);
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG recuperación] buscado:', identificadorLimpio, '| encontrado:', usuario && usuario.length ? `id=${usuario[0].id} email=${usuario[0].email || 'SIN CORREO'}` : 'NO EXISTE');
    }
    if (!usuario || !usuario.length) {
      return true; // no revelar ausencia
    }
    const u = usuario[0];
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const expira = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await pool.query(
      'INSERT INTO password_resets (usuario_id, token_hash, expira_en, usado) VALUES (?, ?, ?, 0)',
      [u.id, tokenHash, expira]
    );

    if (!u.email || !u.email.includes('@')) {
      // Sin correo registrado no hay dónde enviar el enlace; queda registrado.
      console.error('[recuperación] el usuario %s no tiene un correo válido registrado; no se puede enviar el enlace', u.username);
      return true; // no revelar ausencia de correo
    }

    // Configurar nodemailer desde .env (no exponer credenciales en código)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // En desarrollo el sistema se sirve bajo /usuarios (base: '/usuarios/');
    // en producción FRONTEND_URL apunta al dominio (el HTML queda en la raíz).
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5174/usuarios').replace(/\/$/, '');
    const link = `${baseUrl}/restablecer.html?token=${tokenRaw}`;

    const html = `<div style="margin:0; padding:24px; background-color:#f4f4f5; font-family:Arial,Helvetica,sans-serif;">
                   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
                     <tr>
                       ${encabezadoCorreo('FERRETERÍA EL PUENTE', 'Restablecimiento de contraseña')}
                     </tr>
                     <tr>
                       <td style="padding:28px; font-size:14px; color:#27272a;">
                         <p style="margin:0 0 12px;">Hola <strong>${escaparHtml(u.nombre || u.username)}</strong>,</p>
                         <p style="margin:0 0 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>${escaparHtml(u.username)}</strong>.</p>
                         <p style="margin:0 0 20px;">
                           <a href="${link}" style="display:inline-block; padding:12px 22px; background-color:#16a34a; color:#ffffff; text-decoration:none; font-weight:bold; border-radius:8px;">Restablecer contraseña</a>
                         </p>
                         <p style="margin:0 0 10px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                         <p style="margin:0 0 16px; word-break:break-all; font-size:12px; color:#71717a;">${link}</p>
                         <p style="margin:0 0 6px;">El enlace expira en <strong>30 minutos</strong> y solo puede usarse una vez.</p>
                         <p style="margin:0;">Si no solicitaste esto, ignora este mensaje y tu contraseña seguirá igual.</p>
                       </td>
                     </tr>
                     <tr>
                       <td style="padding:14px 28px; background-color:#faf7f2; border-top:1px solid #e4e4e7;">
                         <p style="margin:0; font-size:11px; color:#a1a1aa;">Sistema SGIFEP — Ferretería El Puente</p>
                       </td>
                     </tr>
                   </table>
                 </div>`;

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || `SGIFEP <${process.env.SMTP_USER || 'noreply@sgifep.local'}>`,
        to: u.email,
        subject: 'Restablecer contraseña - Ferretería El Puente',
        html,
        attachments: [adjuntoLogo]
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