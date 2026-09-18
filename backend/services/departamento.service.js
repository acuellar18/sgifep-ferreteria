const { HttpError } = require('../utils/http-error');
const departamentoRepository = require('../repositories/departamento.repository');
const departamentoDto = require('../dtos/departamento.dto');

// Capa de negocio de DEPARTAMENTOS: valida con DTO y delega el SQL.
class DepartamentoService {
  async listar(filtros = {}) {
    const filas = await departamentoRepository.listar({
      estado: filtros.estado,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return departamentoDto.serializarLista(filas);
  }

  async detalle(id) {
    const fila = await departamentoRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Departamento no encontrado');
    return departamentoDto.serializar(fila);
  }

  async crear(datos) {
    const dto = departamentoDto.validar(datos);
    if (await departamentoRepository.buscarPorNombre(dto.nombre)) {
      throw new HttpError(409, 'Ya existe un departamento con ese nombre');
    }
    const nuevoId = await departamentoRepository.crear(dto);
    return departamentoDto.serializar(await departamentoRepository.buscarPorId(nuevoId));
  }

  async actualizar(id, datos) {
    const dto = departamentoDto.validar(datos);
    const existe = await departamentoRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Departamento no encontrado');
    if (await departamentoRepository.buscarPorNombre(dto.nombre, id)) {
      throw new HttpError(409, 'Ya existe un departamento con ese nombre');
    }
    await departamentoRepository.actualizar(id, dto);
    return departamentoDto.serializar(await departamentoRepository.buscarPorId(id));
  }

  async cambiarEstado(id, activo) {
    const valor = departamentoDto.validarEstado(activo);
    const affected = await departamentoRepository.cambiarEstado(id, valor);
    if (affected === 0) throw new HttpError(404, 'Departamento no encontrado');
    return valor ? 'Departamento activado' : 'Departamento inactivado';
  }

  async eliminar(id) {
    const asignados = await departamentoRepository.contarUsuarios(id);
    if (asignados > 0) {
      throw new HttpError(
        409,
        'No se puede eliminar: hay usuarios asignados a este departamento. Inactívelo en su lugar.'
      );
    }
    const affected = await departamentoRepository.eliminar(id);
    if (affected === 0) throw new HttpError(404, 'Departamento no encontrado');
  }
}

module.exports = new DepartamentoService();