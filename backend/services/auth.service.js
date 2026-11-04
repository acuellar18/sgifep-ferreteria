const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { jwt: jwtConfig, ROL_ADMINISTRADOR } = require('../config/auth');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { HttpError } = require('../utils/http-error');
const usuarioRepository = require('../repositories/usuario.repository');
const rolRepository = require('../repositories/rol.repository');
const { registrarAuditoria } = require('../utils/auditoria');
const { validarPassword } = require('../utils/password');
const { crearTransporte, remitente, disponible } = require('../utils/mailer');

// ---------- Fuerza bruta: bloqueo temporal progresivo ----------
// 3 fallos consecutivos bloquean 5 min; cada bloqueo posterior (15/30/60) se
// guarda en la BD (login_bloqueos), nunca en el frontend. El máximo es 1 hora
// y siempre expira: nadie puede bloquear una cuenta de forma definitiva.
const FALLOS_PARA_BLOQUEO = 3;
const SECUENCIA_BLOQUEO_MIN = [5, 15, 30, 60];
// Límite duro por IP entre todos los usuarios (anti-abuso masivo).
const MAX_FALLOS_IP_POR_HORA = 20;
// ---------- Restablecimiento ----------
const RESET_EXPIRA_MINUTOS = 30;
const RESET_BYTES_TOKEN = 32; // 256 bits criptográficos

// Encabezado antracita sin logo: el título a la izquierda y el subtítulo
// en naranja a la derecha (línea gráfica del sistema).
function encabezadoCorreo(titulo, subtitulo) {
  return `<td style="background-color:#141414; padding:18px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0; color:#ffffff; font-size:15px; font-weight:bold;">${titulo}</p>
                    <p style="margin:4px 0 0; color:#ea580c; font-size:12px; text-transform:uppercase; letter-spacing:1px;">${subtitulo}</p>
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

function pieCorreo() {
  return `<tr>
             <td style="padding:14px 28px; background-color:#faf7f2; border-top:1px solid #e4e4e7;">
               <p style="margin:0; font-size:11px; color:#a1a1aa;">Sistema SGIFEP — Ferretería El Puente</p>
             </td>
           </tr>`;
}

// Envuelve el contenido con el encabezado/pie de marca del sistema.
function cuerpoCorreo(interior, subtitulo = 'Aviso de seguridad') {
  return `<div style="margin:0; padding:24px; background-color:#f4f4f5; font-family:Arial,Helvetica,sans-serif;">
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
               ${encabezadoCorreo('FERRETERÍA EL PUENTE', subtitulo)}
               <tr><td style="padding:28px; font-size:14px; color:#27272a;">${interior}</td></tr>
               ${pieCorreo()}
             </table>
           </div>`;
}

// Envía un correo capturando sus errores; nunca incluye tokens en el log.
async function enviarMail(opciones) {
  if (!disponible()) return;
  try {
    await crearTransporte().sendMail({ ...opciones });
  } catch (err) {
    console.error(`[correo] no se pudo enviar "${String(opciones.subject || '')}": error=${err.code || err.message}`);
  }
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

    // Bloqueos siempre en el servidor (BD); el frontend solo muestra el contador.
    await this.verificarLimitesLogin(usuarioIngresado, ip);

    const usuario = await usuarioRepository.buscarConCredenciales(usuarioIngresado);
    if (!usuario || !usuario.activo) {
      // Mismo mensaje para usuario inexistente o inactivo: no se deduce quién tiene cuenta.
      const fallo = await this.registrarFallo(usuarioIngresado, ip, usuario ? 'usuario_inactivo' : 'usuario_inexistente');
      if (fallo.bloqueado) await this.avisarBloqueo(usuario, usuarioIngresado, ip, userAgent);
      this.lanzar429(fallo);
    }

    const passwordValida = await bcrypt.compare(String(password), usuario.password_hash);
    if (!passwordValida) {
      const fallo = await this.registrarFallo(usuarioIngresado, ip, 'password_incorrecta');
      if (fallo.bloqueado) {
        await this.avisarBloqueo(usuario, usuarioIngresado, ip, userAgent);
        await registrarAuditoria(null, {
          usuarioId: usuario.id,
          username: usuario.username,
          accion: 'auth.login.bloqueado',
          entidad: 'usuarios',
          entidadId: usuario.id,
          descripcion: 'Login bloqueado por intentos fallidos de contraseña',
          ip,
          userAgent
        });
      }
      this.lanzar429(fallo, 'Usuario o contraseña incorrectos');
    }

    // Ingreso correcto: reinicia contador y bloqueos de este usuario e IP.
    await this.reiniciarBloqueos(usuarioIngresado, ip);
    await this.registrarIntento(usuarioIngresado, ip, true, null);

    const roles = await rolRepository.buscarRolesDeUsuario(usuario.id);
    const nombresRoles = roles.map((r) => r.nombre);
    const superadmin = roles.some(
      (r) => r.superadmin || r.acceso_total || r.nombre === ROL_ADMINISTRADOR
    );

    // `ver` vincula el JWT a sesiones_version: cambiar la contraseña invalida
    // de inmediato todos los tokens anteriores del usuario.
    const token = jwt.sign(
      {
        sub: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        roles: nombresRoles,
        superadmin,
        ver: usuario.sesiones_version || 1
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

  // ---------- Protección de fuerza bruta ----------

  // Revisa límite por IP (20 fallos/hora entre todos los usuarios) y bloqueo
  // activo por usuario o IP. Lanza 429 con los segundos restantes.
  async verificarLimitesLogin(username, ip) {
    const limiteIp = await this.limiteHoraIp(ip);
    if (limiteIp >= MAX_FALLOS_IP_POR_HORA) {
      const restantes = await this.segundosParaHora(ip, limiteIp);
      throw new HttpError(
        429,
        'Demasiados intentos. Intenta de nuevo más tarde.',
        { segundos: Math.max(60, restantes) }
      );
    }
    const bloqueo = await this.bloqueoActivo(username, ip);
    if (bloqueo) {
      const minutos = Math.ceil(bloqueo.segundos / 60);
      throw new HttpError(
        429,
        `Demasiados intentos. Intenta de nuevo en ${minutos} minuto${minutos === 1 ? '' : 's'}.`,
        { segundos: bloqueo.segundos }
      );
    }
  }

  async limiteHoraIp(ip) {
    if (!ip) return 0;
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM intentos_login
       WHERE exito = 0
         AND ip = ?
         AND creado_en >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [ip]
    );
    return Number(rows[0]?.total || 0);
  }

  // Minutos que faltan para que el primer fallo de la ventana cumpla la hora.
  async segundosParaHora(ip, total = null) {
    const cuenta = total == null ? await this.limiteHoraIp(ip) : total;
    if (cuenta < MAX_FALLOS_IP_POR_HORA) return 0;
    const [rows] = await pool.query(
      `SELECT TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(creado_en, INTERVAL 1 HOUR)) AS segundos
       FROM intentos_login
       WHERE exito = 0 AND ip = ?
         AND creado_en >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
       ORDER BY creado_en ASC LIMIT 1`,
      [ip]
    );
    return Math.max(60, Number(rows[0]?.segundos || 3600));
  }

  // Devuelve { segundos } del bloqueo activo más largo (usuario o IP) o null.
  async bloqueoActivo(username, ip) {
    const claves = [this.claveUsuario(username), this.claveIp(ip)].filter(Boolean);
    const [rows] = await pool.query(
      `SELECT bloqueado_hasta,
              TIMESTAMPDIFF(SECOND, NOW(), bloqueado_hasta) AS segundos
       FROM login_bloqueos
       WHERE clave IN (?) AND bloqueado_hasta > NOW()
       ORDER BY segundos DESC LIMIT 1`,
      [claves]
    );
    const segundos = Number(rows[0]?.segundos || 0);
    return segundos > 0 ? { segundos } : null;
  }

  // Registra el intento fallido y escala el bloqueo si corresponde.
  // Devuelve { bloqueado, segundos, minutosBloqueo }.
  async registrarFallo(username, ip, motivo) {
    await this.registrarIntento(username, ip, false, motivo);
    const escaladoUsuario = await this.registrarFalloClave(this.claveUsuario(username));
    const escaladoIp = await this.registrarFalloClave(this.claveIp(ip));
    const escalado = [escaladoUsuario, escaladoIp].find((e) => e && e.lanzoBloqueo) || escaladoUsuario;
    const activo = await this.bloqueoActivo(username, ip);
    return {
      bloqueado: Boolean(activo),
      segundos: activo ? activo.segundos : 0,
      minutosBloqueo: escalado?.minutos || SECUENCIA_BLOQUEO_MIN[0]
    };
  }

  // Claves de bloqueo separadas: un atacante no bloquea a otra persona desde
  // su IP, y una IP atacante no condena al usuario legítimo para siempre.
  claveUsuario(username) {
    return username ? `u:${String(username).slice(0, 67)}` : null;
  }

  claveIp(ip) {
    return ip ? `ip:${String(ip).slice(0, 67)}` : null;
  }

  // Upsert atómico de la racha: incrementa el contador y, al llegar al umbral,
  // aplica el bloqueo del nivel siguiente (5 → 15 → 30 → 60 min).
  async registrarFalloClave(clave) {
    if (!clave) return null;
    try {
      await pool.query(
        `INSERT INTO login_bloqueos (clave, intentos_consecutivos, nivel, bloqueado_hasta)
         VALUES (?, 1, 0, NULL)
         ON DUPLICATE KEY UPDATE intentos_consecutivos = intentos_consecutivos + 1`,
        [clave]
      );
      const [rows] = await pool.query(
        'SELECT intentos_consecutivos, nivel, bloqueado_hasta FROM login_bloqueos WHERE clave = ? LIMIT 1',
        [clave]
      );
      const fila = rows[0];
      if (!fila) return null;
      const bloqueadoAhora = fila.bloqueado_hasta && new Date(fila.bloqueado_hasta) > new Date();
      if (bloqueadoAhora) return { lanzoBloqueo: false };

      // El bloqueo anterior ya expiró o venció: si la racha sigue sobre el
      // umbral, se aplica el siguiente nivel (progresión 5/15/30/60 max 1 h).
      if (Number(fila.intentos_consecutivos) >= FALLOS_PARA_BLOQUEO) {
        const nivel = Math.min(Number(fila.nivel) + 1, SECUENCIA_BLOQUEO_MIN.length);
        const minutos = SECUENCIA_BLOQUEO_MIN[nivel - 1];
        await pool.query(
          `UPDATE login_bloqueos
           SET nivel = ?, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL ? MINUTE)
           WHERE clave = ?`,
          [nivel, minutos, clave]
        );
        return { lanzoBloqueo: true, minutos };
      }
      return { lanzoBloqueo: false };
    } catch (error) {
      console.error('No se pudo actualizar el bloqueo de login:', error.message);
      return null;
    }
  }

  // Éxito: contador a cero y bloqueo del usuario/IP liberado.
  async reiniciarBloqueos(username, ip) {
    const claves = [this.claveUsuario(username), this.claveIp(ip)].filter(Boolean);
    if (!claves.length) return;
    try {
      await pool.query('DELETE FROM login_bloqueos WHERE clave IN (?)', [claves]);
    } catch (error) {
      console.error('No se pudo reiniciar el bloqueo de login:', error.message);
    }
  }

  // Aviso al dueño de la cuenta cuando su usuario fue bloqueado (en segundo plano).
  avisarBloqueo(usuario, usernameIngresado, ip, userAgent) {
    if (!usuario || !usuario.email || !usuario.email.includes('@')) return;
    const interior = `
          <p style="margin:0 0 12px;">Hola <strong>${escaparHtml(usuario.nombre || usuario.username)}</strong>,</p>
          <p style="margin:0 0 12px;">Detectamos varios intentos fallidos de acceso a tu cuenta <strong>${escaparHtml(usuario.username)}</strong>.</p>
          <p style="margin:0 0 12px;">Por seguridad, el inicio de sesión quedó bloqueado temporalmente (máximo 1 hora).</p>
          <p style="margin:0;">Si no fuiste tú, te recomendamos restablecer tu contraseña desde el formulario "¿Olvidaste tu contraseña?".</p>`;
    void enviarMail({
      from: remitente(),
      to: usuario.email,
      subject: 'Acceso bloqueado temporalmente - Ferretería El Puente',
      html: cuerpoCorreo(interior)
    });
  }

  // ---------- Registro de intentos (sin datos sensibles) ----------

  // Fecha, IP, usuario intentado y resultado; nunca la contraseña escrita.
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

  lanzar429(fallo, mensaje) {
    if (fallo?.bloqueado && fallo.segundos > 0) {
      // El bloqueo acaba de dispararse: mismo contrato que el bloqueo activo.
      const minutos = Math.ceil(fallo.segundos / 60);
      throw new HttpError(
        429,
        `Demasiados intentos. Intenta de nuevo en ${minutos} minuto${minutos === 1 ? '' : 's'}.`,
        { segundos: fallo.segundos }
      );
    }
    // Credenciales incorrectas: mensaje único, sin indicar qué falló ni si la cuenta existe.
    throw new HttpError(401, mensaje || 'Usuario o contraseña incorrectos');
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
      const para = process.env.CONTACTO_EMAIL || process.env.SMTP_USER;
      if (!para) return;
      const nombres = [dto.nombre, dto.apellido].filter(Boolean).join(' ');

      await enviarMail({
        from: remitente(),
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
                       <div style="margin:18px 0 0; padding:16px 18px; background-color:#fef3ec; border-left:4px solid #ea580c; border-radius:6px;">
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
               </div>`
      });
    } catch (err) {
      console.error('[registro] error enviando aviso al administrador:', err.message || err);
    }
  }

  // ---------- Recuperación por token (flujo de dos campos) ----------
  // Recibe usuario + correo del formulario. Validación de identidad:
  //   * busca EXCLUSIVAMENTE por username;
  //   * compara el correo escrito contra el guardado (sin distinguir mayúsculas);
  //   * si no coincide o el usuario no existe, NO envía nada;
  //   * el enlace viaja SIEMPRE al correo guardado en BD, nunca al ingresado.
  async solicitarRestablecer({ usuario, correo }, contexto = {}) {
    const nombreUsuario = String(usuario || '').trim().toLowerCase();
    const correoIngresado = String(correo || '').trim().toLowerCase();

    const [filas] = await pool.query(
      'SELECT id, username, nombre, email FROM usuarios WHERE LOWER(username) = ? LIMIT 1',
      [nombreUsuario]
    );
    const u = filas[0];

    const correoCoincide =
      !!u && !!u.email && String(u.email).trim().toLowerCase() === correoIngresado;

    // Anti-enumeración: mismo resultado (silencio) en todos los casos de fallo.
    if (!correoCoincide) {
      await this.registrarIntentoReset(contexto.ip, 'datos_no_coinciden');
      await registrarAuditoria(null, {
        accion: 'auth.reset.solicitud',
        entidad: 'usuarios',
        descripcion: 'Solicitud de restablecimiento con usuario o correo que no coinciden',
        ip: contexto.ip,
        userAgent: contexto.userAgent
      });
      return true;
    }

    // Un solo token vivo: invalida los anteriores del usuario.
    await pool.query('UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND usado = 0', [
      u.id
    ]);

    if (!u.email || !String(u.email).includes('@')) {
      await this.registrarIntentoReset(contexto.ip, 'sin_correo');
      return true;
    }

    // Token aleatorio criptográficamente seguro; en BD solo su hash SHA-256.
    const tokenRaw = crypto.randomBytes(RESET_BYTES_TOKEN).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const expira = new Date(Date.now() + RESET_EXPIRA_MINUTOS * 60 * 1000);

    await pool.query(
      'INSERT INTO password_resets (usuario_id, token_hash, expira_en, usado) VALUES (?, ?, ?, 0)',
      [u.id, tokenHash, expira]
    );

    await this.enviarEnlaceRestablecimiento(u, tokenRaw);
    await this.registrarIntentoReset(contexto.ip, 'enlace_enviado');
    return true;
  }

  // Enlace con el formato https://mi-dominio.com/reset-password?token=XXXX
  // (la base se ajusta con FRONTEND_URL / RESET_PASSWORD_URL en .env).
  baseUrlRestablecimiento() {
    const base = (
      process.env.RESET_PASSWORD_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:5174/usuarios'
    ).replace(/\/+$/, '');
    return base;
  }

  async enviarEnlaceRestablecimiento(u, tokenRaw) {
    const baseUrl = this.baseUrlRestablecimiento();
    const ruta = process.env.RESET_PASSWORD_URL ? 'reset-password' : 'restablecer.html';
    const link = `${baseUrl}/${ruta}?token=${tokenRaw}`;
    const minutos = RESET_EXPIRA_MINUTOS;

    await enviarMail({
      from: remitente(),
      to: u.email, // SIEMPRE el correo guardado en la base de datos
      subject: 'Restablecer contraseña - Ferretería El Puente',
      html: cuerpoCorreo(`
             <p style="margin:0 0 12px;">Hola <strong>${escaparHtml(u.nombre || u.username)}</strong>,</p>
             <p style="margin:0 0 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>${escaparHtml(u.username)}</strong>.</p>
             <p style="margin:0 0 20px;">
                <a href="${link}" style="display:inline-block; padding:12px 22px; background-color:#ea580c; color:#ffffff; text-decoration:none; font-weight:bold; border-radius:8px;">Restablecer contraseña</a>
             </p>
             <p style="margin:0 0 10px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
             <p style="margin:0 0 16px; word-break:break-all; font-size:12px; color:#71717a;">${link}</p>
             <p style="margin:0 0 6px;">El enlace expira en <strong>${minutos} minutos</strong> y solo puede usarse una vez.</p>
             <p style="margin:0;">Si no solicitaste esto, ignora este mensaje y tu contraseña seguirá igual.</p>`)
    });
  }

  // Registro de solicitudes: fecha, IP y resultado; sin identificadores en claro.
  async registrarIntentoReset(ip, resultado) {
    try {
      await pool.query(
        'INSERT INTO intentos_reset (ip, resultado) VALUES (?, ?)',
        [ip ? String(ip).slice(0, 45) : null, String(resultado).slice(0, 40)]
      );
    } catch (error) {
      console.error('No se pudo registrar el intento de reset:', error.message);
    }
  }

  // Canjea el token: valida existencia por hash, vigencia y un solo uso;
  // guarda bcrypt y suma sesiones_version para cerrar todas las sesiones.
  async validarRestablecer(token, newPassword, contexto = {}) {
    if (!token || typeof token !== 'string' || !newPassword) {
      throw new HttpError(400, 'Token y nueva contraseña son requeridos');
    }
    const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

    const [rows] = await pool.query(
      `SELECT r.id, r.usuario_id, r.expira_en, r.usado, u.username, u.nombre, u.email
       FROM password_resets r
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.token_hash = ?
       LIMIT 1`,
      [tokenHash]
    );
    const registro = rows[0];
    if (!registro) throw new HttpError(400, 'Token inválido, expirado o ya usado');

    if (Number(registro.usado) === 1) {
      await this.marcarTokensUsados(registro.usuario_id);
      throw new HttpError(400, 'Token inválido, expirado o ya usado');
    }
    if (new Date(registro.expira_en) <= new Date()) {
      await this.marcarTokensUsados(registro.usuario_id);
      throw new HttpError(400, 'Token inválido, expirado o ya usado');
    }

    // Misma política del sistema (8+ caracteres, mayúscula, minúscula, número).
    validarPassword(String(newPassword), { username: registro.username });
    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('UPDATE usuarios SET password_hash = ?, sesiones_version = sesiones_version + 1 WHERE id = ?', [
        passwordHash,
        registro.usuario_id
      ]);
      // Un solo uso: el token queda muerto al instante.
      await connection.query('UPDATE password_resets SET usado = 1 WHERE id = ?', [registro.id]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
    // Todo otro token pendiente del usuario queda invalidado.
    await this.marcarTokensUsados(registro.usuario_id);

    await registrarAuditoria(null, {
      username: registro.username,
      accion: 'auth.password.reset_token',
      entidad: 'usuarios',
      entidadId: registro.usuario_id,
      descripcion: 'Contraseña restablecida con token seguro; sesiones previas invalidadas',
      ip: contexto.ip,
      userAgent: contexto.userAgent
    });

    // Aviso al correo guardado en BD (en segundo plano).
    this.notificarCambioPassword(registro).catch(() => {});
    return true;
  }

  async marcarTokensUsados(usuarioId) {
    try {
      await pool.query('UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND usado = 0', [usuarioId]);
    } catch (error) {
      console.error('No se pudo invalidar tokens previos:', error.message);
    }
  }

  // Correo "Tu contraseña fue cambiada" si el cambio no fue tú.
  async notificarCambioPassword({ username, nombre, email }) {
    const interior = `
          <p style="margin:0 0 12px;">Hola <strong>${escaparHtml(nombre || username)}</strong>,</p>
          <p style="margin:0 0 12px;">Tu contraseña fue cambiada.</p>
          <p style="margin:0 0 12px;">Por seguridad, <strong>se cerraron todas tus sesiones activas</strong> y deberás iniciar sesión nuevamente.</p>
          <p style="margin:0;">Si no fuiste tú, contacta de inmediato al administrador del sistema.</p>`;
    if (email && String(email).includes('@')) {
      await enviarMail({
        from: remitente(),
        to: email,
        subject: 'Tu contraseña fue cambiada - Ferretería El Puente',
        html: cuerpoCorreo(interior)
      });
    }
  }
}

module.exports = new AuthService();
