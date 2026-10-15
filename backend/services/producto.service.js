const { HttpError } = require('../utils/http-error');
const productoRepository = require('../repositories/producto.repository');
const productoDto = require('../dtos/producto.dto');

class ProductoService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await productoRepository.listar({
      q: filtros.q,
      estado: filtros.estado,
      categoria: filtros.categoria,
      stockBajo: filtros.stockBajo,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: productoDto.serializarLista(rows), total, page, pageSize };
  }

  async autocompletar(q, limite = 10) {
    if (!q || q.length < 2) return { data: [] };
    const rows = await productoRepository.buscarAutocompletar(q, limite);
    return { data: productoDto.serializarAutocompletar(rows) };
  }

  async detalle(id) {
    const fila = await productoRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Producto no encontrado');
    return productoDto.serializar(fila);
  }

  async crear(datos) {
    const dto = productoDto.validarCrear(datos);

    if (await productoRepository.buscarPorCodigo(dto.codigo)) {
      throw new HttpError(409, 'Ya existe un producto con ese código');
    }

    const id = await productoRepository.crear(dto);
    return id;
  }

  async actualizar(id, datos) {
    const dto = productoDto.validarActualizar(datos);

    const existe = await productoRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Producto no encontrado');

    if (dto.codigo && await productoRepository.buscarPorCodigo(dto.codigo, id)) {
      throw new HttpError(409, 'Ya existe un producto con ese código');
    }

    await productoRepository.actualizar(id, dto);
  }

  async cambiarEstado(id, activo) {
    const valor = Number(activo);
    if (valor !== 0 && valor !== 1) throw new HttpError(400, 'El campo activo debe ser 0 o 1');
    const affected = await productoRepository.cambiarEstado(id, valor);
    if (affected === 0) throw new HttpError(404, 'Producto no encontrado');
    return valor ? 'Producto activado' : 'Producto inactivado';
  }

  async eliminar(id) {
    const affected = await productoRepository.eliminar(id);
    if (affected === 0) throw new HttpError(404, 'Producto no encontrado');
  }

  async obtenerCategorias() {
    return await productoRepository.obtenerCategorias();
  }
}

module.exports = new ProductoService();