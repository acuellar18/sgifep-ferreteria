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
      estadoStock: filtros.estadoStock,
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

  async resumen(opciones = {}) {
    const { totales, stockBajo, agotados } = await productoRepository.resumen();
    const productos = Number(totales.productos || 0);
    const stockBajoTotal = Number(totales.stock_bajo || 0);
    const agotadosTotal = Number(totales.agotados || 0);
    return {
      productos,
      unidades: Number(totales.unidades || 0),
      valor: opciones.incluirCostos ? Number(totales.valor || 0) : null,
      valor_costo: 'promedio',
      stock_bajo: stockBajoTotal,
      agotados: agotadosTotal,
      disponibles: Math.max(0, productos - stockBajoTotal - agotadosTotal),
      productos_stock_bajo: stockBajo.map((fila) => ({
        id: fila.id,
        nombre: fila.nombre,
        stock_actual: Number(fila.stock_actual || 0),
        stock_minimo: Number(fila.stock_minimo || 0)
      })),
      productos_agotados: agotados.map((fila) => ({
        id: fila.id,
        nombre: fila.nombre,
        stock_actual: Number(fila.stock_actual || 0),
        stock_minimo: Number(fila.stock_minimo || 0)
      }))
    };
  }

  async crear(datos, usuarioId = null) {
    throw new HttpError(400, 'La creación manual de productos está deshabilitada. Los productos se crean desde el módulo de Compras al registrar una compra.');
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

    // No permitir modificar stock/costos desde inventario manualmente
    delete dto.stock_actual;
    delete dto.costo_ultimo;
    delete dto.costo_promedio;
    delete dto.stock_inicial;
    delete dto.costo_inicial;

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
    const soloInventarioInicial =
      dependencias.movimientos > 0 &&
      dependencias.movimientos === dependencias.movimientos_iniciales;
    const tieneDependenciasBloqueantes =
      (dependencias.movimientos > 0 && !soloInventarioInicial) ||
      dependencias.compras > 0 ||
      dependencias.ordenes > 0 ||
      dependencias.facturas > 0;

    if (tieneDependenciasBloqueantes) {
      throw new HttpError(
        409,
        'No se puede eliminar un producto con movimientos distintos al inventario inicial, compras, órdenes o facturas asociadas. Puede inactivarlo.'
      );
    }

    const affected = soloInventarioInicial
      ? await productoRepository.eliminarConInventarioInicial(id)
      : await productoRepository.eliminar(id);
    if (affected === 0) throw new HttpError(404, 'Producto no encontrado');
    await productoImagenService.eliminarArchivos(producto);
  }

  async obtenerCategorias() {
    return await productoRepository.obtenerCategorias();
  }
}

module.exports = new ProductoService();
