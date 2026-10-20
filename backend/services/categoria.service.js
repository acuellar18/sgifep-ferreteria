const { HttpError } = require('../utils/http-error');
const categoriaRepository = require('../repositories/categoria.repository');
const categoriaDto = require('../dtos/categoria.dto');

class CategoriaService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await categoriaRepository.listar({
      q: filtros.q,
      estado: filtros.estado,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: categoriaDto.serializarLista(rows), total, page, pageSize };
  }

  async detalle(id) {
    const fila = await categoriaRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Categoría no encontrada');
    return categoriaDto.serializar(fila);
  }

  async crear(datos) {
    const dto = categoriaDto.validarCrear(datos);
    if (await categoriaRepository.buscarPorNombre(dto.nombre)) {
      throw new HttpError(409, 'Ya existe una categoría con ese nombre');
    }
    const id = await categoriaRepository.crear(dto);
    return id;
  }

  async actualizar(id, datos) {
    const dto = categoriaDto.validarActualizar(datos);
    const existe = await categoriaRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Categoría no encontrada');

    if (await categoriaRepository.buscarPorNombre(dto.nombre, id)) {
      throw new HttpError(409, 'Ya existe una categoría con ese nombre');
    }

    await categoriaRepository.actualizar(id, dto);
  }

  async cambiarEstado(id, activo) {
    const valor = Number(activo);
    if (valor !== 0 && valor !== 1) {
      throw new HttpError(400, 'El campo activo debe ser 0 o 1');
    }
    const existe = await categoriaRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Categoría no encontrada');

    await categoriaRepository.cambiarEstado(id, valor);
    return valor ? 'Categoría activada' : 'Categoría inactivada';
  }

  async eliminar(id) {
    const resultado = await categoriaRepository.eliminarSiSinProductos(id);
    if (!resultado.encontrada) throw new HttpError(404, 'Categoría no encontrada');
    if (resultado.conProductos) {
      throw new HttpError(409, 'No se puede eliminar una categoría con productos asociados');
    }
  }
}

module.exports = new CategoriaService();
