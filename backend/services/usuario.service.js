const bcrypt = require('bcryptjs');
const pool = require('../db');
const { HttpError } = require('../utils/http-error');
const usuarioRepository = require('../repositories/usuario.repository');
const rolRepository = require('../repositories/rol.repository');
const departamentoRepository = require('../repositories/departamento.repository');
const usuarioDto = require('../dtos/usuario.dto');

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
    const affected = await usuarioRepository.cambiarEstado(id, valor);
    if (affected === 0) throw new HttpError(404, 'Usuario no encontrado');
    return valor ? 'Usuario activado' : 'Usuario inactivado';
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
      porRol: reporte.porRol.map((r) => ({ ...r, superadmin: r.acceso_total }))
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