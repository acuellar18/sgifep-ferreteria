const { HttpError } = require('../utils/http-error');
const productoRepository = require('../repositories/producto.repository');
const productoDto = require('../dtos/producto.dto');
const productoImagenService = require('./producto-imagen.service');

class ProductoService {
  async listar(filtros = {}, opciones = {}) {
    const { rows, total, page, pageSize } = await productoRepository.listar({
      q: filtros.q,
      estado: filtros.estado,
      categoria: filtros.categoria,
      tipo: filtros.tipo,
      stockBajo: filtros.stockBajo,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: productoDto.serializarLista(rows, opciones), total, page, pageSize };
  }

  async autocompletar(q, limite = 10, opciones = {}) {
    if (!q || q.length < 2) return { data: [] };
    const rows = await productoRepository.buscarAutocompletar(q, limite);
    return { data: productoDto.serializarAutocompletar(rows, opciones) };
  }

  async detalle(id, opciones = {}) {
    const fila = await productoRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Producto no encontrado');
    return productoDto.serializar(fila, opciones);
  }

  async crear(datos, usuarioId = null) {
    const dto = productoDto.validarCrear(datos);

    if (await productoRepository.buscarPorCodigo(dto.codigo)) {
      throw new HttpError(409, 'Ya existe un producto con ese código');
    }
    if (await productoRepository.buscarPorCodigoBarras(dto.codigo_barras)) {
      throw new HttpError(409, 'Ya existe un producto con ese código de barras');
    }

    const id = await productoRepository.crear({ ...dto, usuario_id: usuarioId });
    return id;
  }

  async actualizar(id, datos) {
    const dto = productoDto.validarActualizar(datos);

    const existe = await productoRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Producto no encontrado');

    if (dto.codigo && await productoRepository.buscarPorCodigo(dto.codigo, id)) {
      throw new HttpError(409, 'Ya existe un producto con ese código');
    }
    if (dto.codigo_barras && await productoRepository.buscarPorCodigoBarras(dto.codigo_barras, id)) {
      throw new HttpError(409, 'Ya existe un producto con ese código de barras');
    }

    if (dto.tipo === 'servicio' && Number(existe.stock_actual) > 0) {
      throw new HttpError(
        409,
        'No se puede convertir en servicio un producto con existencias. Ajuste el stock a cero primero.'
      );
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
    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');

    const dependencias = await productoRepository.contarDependencias(id);
    if (dependencias.movimientos || dependencias.compras || dependencias.ordenes) {
      throw new HttpError(
        409,
        'No se puede eliminar un producto con movimientos, compras u órdenes asociadas. Puede inactivarlo.'
      );
    }

    const affected = await productoRepository.eliminar(id);
    if (affected === 0) throw new HttpError(404, 'Producto no encontrado');
    await productoImagenService.eliminarArchivos(producto);
  }

  async obtenerCategorias() {
    return await productoRepository.obtenerCategorias();
  }
}

module.exports = new ProductoService();
