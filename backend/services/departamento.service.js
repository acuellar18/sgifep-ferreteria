const { HttpError } = require('../utils/http-error');
const departamentoRepository = require('../repositories/departamento.repository');
const departamentoDto = require('../dtos/departamento.dto');

// Normaliza un nombre para comparar duplicados sin distinguir mayúsculas,
// tildes ni espacios repetidos. No depende de la collation de la base de datos.
function normalizarNombre(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

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
    await this.validarNombreUnico(dto.nombre);
    try {
      const nuevoId = await departamentoRepository.crear(dto);
      return departamentoDto.serializar(await departamentoRepository.buscarPorId(nuevoId));
    } catch (err) {
      // El índice UNIQUE (collation insensible a tildes/mayúsculas) es la
      // segunda barrera: cubre la condición de carrera entre la validación
      // previa y la inserción, y devuelve el mismo 409 amigable.
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'Ya existe un departamento con ese nombre');
      }
      throw err;
    }
  }

  async actualizar(id, datos) {
    const dto = departamentoDto.validar(datos);
    const existe = await departamentoRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Departamento no encontrado');
    await this.validarNombreUnico(dto.nombre, id);
    try {
      await departamentoRepository.actualizar(id, dto);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'Ya existe un departamento con ese nombre');
      }
      throw err;
    }
    return departamentoDto.serializar(await departamentoRepository.buscarPorId(id));
  }

  // Compara el nombre normalizado contra todos los existentes (excepto el que
  // se está editando). Así se evita "Administración"/"Administracion"/etc.
  async validarNombreUnico(nombre, excluirId = null) {
    const objetivo = normalizarNombre(nombre);
    const existentes = await departamentoRepository.listarNombres();
    const duplicado = existentes.find(
      (d) => Number(d.id) !== Number(excluirId) && normalizarNombre(d.nombre) === objetivo
    );
    if (duplicado) {
      throw new HttpError(409, 'Ya existe un departamento con ese nombre');
    }
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