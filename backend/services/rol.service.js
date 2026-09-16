const pool = require('../db');
const { HttpError } = require('../utils/http-error');
const rolRepository = require('../repositories/rol.repository');
const rolDto = require('../dtos/rol.dto');

// Capa de negocio de ROLES: valida con DTO, aplica reglas y delega el SQL.
class RolService {
  async listar(filtros = {}) {
    const filas = await rolRepository.listar({ estado: filtros.estado });
    return rolDto.serializarLista(filas);
  }

  async detalle(id) {
    const fila = await rolRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Rol no encontrado');
    return rolDto.serializar(fila);
  }

  async crear(datos) {
    const dto = rolDto.validar(datos);
    if (await rolRepository.buscarPorNombre(dto.nombre)) {
      throw new HttpError(409, 'Ya existe un rol con ese nombre');
    }
    const nuevoId = await rolRepository.crear(dto);
    return rolDto.serializar(await rolRepository.buscarPorId(nuevoId));
  }

  async actualizar(id, datos) {
    const dto = rolDto.validar(datos);
    const existe = await rolRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Rol no encontrado');
    if (await rolRepository.buscarPorNombre(dto.nombre, id)) {
      throw new HttpError(409, 'Ya existe un rol con ese nombre');
    }
    await rolRepository.actualizar(id, dto);
    return rolDto.serializar(await rolRepository.buscarPorId(id));
  }

  async cambiarEstado(id, activo) {
    const valor = rolDto.validarEstado(activo);
    const affected = await rolRepository.cambiarEstado(id, valor);
    if (affected === 0) throw new HttpError(404, 'Rol no encontrado');
    return valor ? 'Rol activado' : 'Rol inactivado';
  }

  async eliminar(id) {
    const asignados = await rolRepository.contarUsuariosAsignados(id);
    if (asignados > 0) {
      throw new HttpError(
        409,
        'No se puede eliminar: hay usuarios con este rol asignado. Inactívelo en su lugar.'
      );
    }
    const affected = await rolRepository.eliminar(id);
    if (affected === 0) throw new HttpError(404, 'Rol no encontrado');
  }
}

module.exports = new RolService();