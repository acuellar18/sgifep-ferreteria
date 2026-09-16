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
    const filas = await usuarioRepository.listar({
      q: filtros.q,
      estado: filtros.estado,
      startDate: filtros.startDate || filtros.fechaInicio,
      endDate: filtros.endDate || filtros.fechaFin,
      departamento: filtros.departamento,
      rol: filtros.rol
    });
    return usuarioDto.serializarLista(filas);
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

  async reporte() {
    const [totales, porDepartamento, porRol] = await Promise.all([
      usuarioRepository.contarTotales(),
      usuarioRepository.contarActivosPorDepartamento(),
      usuarioRepository.contarActivosPorRol()
    ]);

    return {
      totales: {
        total: Number(totales.total) || 0,
        activos: Number(totales.activos) || 0,
        inactivos: Number(totales.inactivos) || 0
      },
      porDepartamento: porDepartamento.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        total_activos: Number(d.total_activos) || 0
      })),
      porRol: porRol.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        superadmin: Boolean(r.acceso_total),
        acceso_total: Boolean(r.acceso_total),
        total_activos: Number(r.total_activos) || 0
      }))
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