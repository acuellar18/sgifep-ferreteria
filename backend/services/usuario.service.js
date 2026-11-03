const bcrypt = require('bcryptjs');
const pool = require('../db');
const { HttpError } = require('../utils/http-error');
const usuarioRepository = require('../repositories/usuario.repository');
const rolRepository = require('../repositories/rol.repository');
const departamentoRepository = require('../repositories/departamento.repository');
const usuarioDto = require('../dtos/usuario.dto');

function escaparNombre(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Capa de negocio de USUARIOS: reglas (unicidad, referencias, roles múltiples)
// y transacciones atómicas. No conoce HTTP: lanza HttpError para el controlador.
class UsuarioService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await usuarioRepository.listar({
      q: filtros.q,
      estado: filtros.estado,
      startDate: filtros.startDate || filtros.fechaInicio,
      endDate: filtros.endDate || filtros.fechaFin,
      departamento: filtros.departamento,
      rol: filtros.rol,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: usuarioDto.serializarLista(rows), total, page, pageSize };
  }

  async detalle(id) {
    const fila = await usuarioRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Usuario no encontrado');
    return usuarioDto.serializar(fila);
  }

  async crear(datos) {
    const dto = usuarioDto.validarCrear(datos);

    if (await usuarioRepository.buscarPorUsername(dto.username)) {
      throw new HttpError(409, 'Ya existe un usuario con ese nombre de usuario');
    }
    if (await usuarioRepository.buscarPorCodigo(dto.codigo)) {
      throw new HttpError(409, 'Ya existe un usuario con ese código');
    }
    await this.validarReferencias(dto.departamento_id, dto.roles);

    const password_hash = await bcrypt.hash(dto.password, 10);
    const rolesValidos = await rolRepository.buscarPorIdsActivos(dto.roles);
    const rolLegacy = rolesValidos[0]?.nombre || 'admin';

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const nuevoId = await usuarioRepository.crear(connection, {
        ...dto,
        password_hash,
        rol: rolLegacy
      });
      if (rolesValidos.length > 0) {
        await usuarioRepository.asignarRoles(
          connection,
          nuevoId,
          rolesValidos.map((r) => r.id)
        );
      }
      await connection.commit();
      return nuevoId;
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'El código o nombre de usuario ya está en uso');
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async actualizar(id, datos) {
    const dto = usuarioDto.validarActualizar(datos);

    const existe = await usuarioRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Usuario no encontrado');

    if (await usuarioRepository.buscarPorUsername(dto.username, id)) {
      throw new HttpError(409, 'Ya existe un usuario con ese nombre de usuario');
    }
    if (await usuarioRepository.buscarPorCodigo(dto.codigo, id)) {
      throw new HttpError(409, 'Ya existe un usuario con ese código');
    }
    await this.validarReferencias(dto.departamento_id, dto.roles);

    const rolesValidos = await rolRepository.buscarPorIdsActivos(dto.roles);
    const rolLegacy = rolesValidos[0]?.nombre || 'admin';

    // Si no viene contraseña nueva, se conserva la actual (nunca se expone).
    let password_hash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : await usuarioRepository.obtenerPasswordHash(id);
    if (!password_hash) {
      throw new HttpError(400, 'No se pudo conservar la contraseña del usuario');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await usuarioRepository.actualizar(connection, id, {
        ...dto,
        password_hash,
        rol: rolLegacy
      });
      await usuarioRepository.reemplazarRoles(
        connection,
        id,
        rolesValidos.map((r) => r.id)
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'El código o nombre de usuario ya está en uso');
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async cambiarEstado(id, activo) {
    const valor = Number(activo);
    if (valor !== 0 && valor !== 1) {
      throw new HttpError(400, 'El campo activo debe ser 0 o 1');
    }
    // Datos ANTES del cambio: así se sabe a quién avisar (si tiene correo) y
    // el estado previo para no duplicar el aviso si ya estaba activo.
    const usuario = await usuarioRepository.obtenerDatosActivacion(id);

    const affected = await usuarioRepository.cambiarEstado(id, valor);
    if (affected === 0) throw new HttpError(404, 'Usuario no encontrado');

    if (valor === 1 && usuario && usuario.email && usuario.email.includes('@')) {
      await this.notificarActivacion(usuario).catch(() => {});
    }
    return valor ? 'Usuario activado' : 'Usuario inactivado';
  }

  // Correo "tu cuenta ya está activa": se envía al activar (equivalente a
  // aprobar el registro público o reactivar un usuario desde el módulo Users).
  async notificarActivacion(usuario) {
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

      const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5174/usuarios').replace(/\/$/, '');
      const link = `${baseUrl}/login.html`;
      const nombres = [usuario.nombre].filter(Boolean).join(' ');
      const remitente = process.env.MAIL_FROM || `Sistema SGIFEP <${user}>`;

      await transporter.sendMail({
        from: remitente,
        to: usuario.email,
        subject: 'Tu cuenta ya está activa - Ferretería El Puente',
        text: [
          `Hola ${nombres || usuario.username},`,
          '',
          'Tu cuenta del sistema SGIFEP fue activada por un administrador.',
          'Ya puedes iniciar sesión con tu usuario y tu contraseña:',
          link,
          '',
          'Ferretería El Puente'
        ].join('\n'),
        html: `<div style="margin:0; padding:24px; background-color:#f4f4f5; font-family:Arial,Helvetica,sans-serif;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
                   <tr>
                     <td style="background-color:#141414; padding:18px 28px;">
                       <p style="margin:0; color:#ffffff; font-size:15px; font-weight:bold;">FERRETERÍA EL PUENTE</p>
                       <p style="margin:4px 0 0; color:#ea580c; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Cuenta activada</p>
                     </td>
                   </tr>
                   <tr>
                     <td style="padding:28px; font-size:14px; color:#27272a;">
                       <p style="margin:0 0 12px;">Hola <strong>${escaparNombre(nombres || usuario.username)}</strong>,</p>
                       <p style="margin:0 0 16px;">Tu cuenta <strong>${escaparNombre(usuario.username)}</strong> fue <strong>activada</strong> por un administrador. Ya puedes iniciar sesión con tu usuario y tu contraseña.</p>
                       <p style="margin:0 0 20px;">
                         <a href="${link}" style="display:inline-block; padding:12px 22px; background-color:#ea580c; color:#ffffff; text-decoration:none; font-weight:bold; border-radius:8px;">Iniciar sesión</a>
                       </p>
                       <p style="margin:0 0 10px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                       <p style="margin:0; word-break:break-all; font-size:12px; color:#71717a;">${link}</p>
                     </td>
                   </tr>
                   <tr>
                     <td style="padding:14px 28px; background-color:#faf7f2; border-top:1px solid #e4e4e7;">
                       <p style="margin:0; font-size:11px; color:#a1a1aa;">Sistema SGIFEP — Ferretería El Puente</p>
                     </td>
                   </tr>
                 </table>
               </div>`
      });
    } catch (err) {
      // No interrumpe la activación: el estado ya cambió en la BD.
      console.error('[usuarios] error enviando correo de activación:', err.message || err);
    }
  }

  async eliminar(id) {
    const affected = await usuarioRepository.eliminar(id);
    if (affected === 0) throw new HttpError(404, 'Usuario no encontrado');
  }

  // Reporte inteligente: admite los mismos filtros que el listado (q, estado,
  // departamento, rol, startDate/endDate) para que el reporte y la tabla de
  // usuarios siempre respondan a un único criterio de búsqueda.
  async reporte(filtros = {}) {
    const reporte = await usuarioRepository.reporte({
      q: filtros.q,
      estado: filtros.estado,
      startDate: filtros.startDate || filtros.fechaInicio,
      endDate: filtros.endDate || filtros.fechaFin,
      departamento: filtros.departamento,
      rol: filtros.rol
    });

    return {
      totales: reporte.totales,
      porDepartamento: reporte.porDepartamento,
      porRol: reporte.porRol.map((r) => ({ ...r, superadmin: r.acceso_total })),
      usuarios: reporte.usuarios || []
    };
  }

  // Regla de integridad: el departamento debe existir/estar activo y todos los
  // roles seleccionados deben existir y estar activos (roles MÚLTIPLES).
  async validarReferencias(departamentoId, rolesIds) {
    if (departamentoId) {
      const departamento = await departamentoRepository.buscarPorId(departamentoId);
      if (!departamento || !departamento.activo) {
        throw new HttpError(400, 'El departamento indicado no existe o está inactivo');
      }
    }
    if (rolesIds.length > 0) {
      const validos = await rolRepository.buscarPorIdsActivos(rolesIds);
      if (validos.length !== rolesIds.length) {
        throw new HttpError(400, 'Uno o más roles no existen o están inactivos');
      }
    }
  }
}

module.exports = new UsuarioService();