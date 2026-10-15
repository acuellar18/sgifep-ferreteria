const { HttpError } = require('../utils/http-error');
const reporteCompraRepository = require('../repositories/reporte-compra.repository');

class ReporteCompraService {
  async resumen(filtros = {}) {
    return { data: await reporteCompraRepository.resumenCompras(filtros) };
  }

  async comprasPorMes(filtros = {}) {
    return { data: await reporteCompraRepository.comprasPorMes(filtros) };
  }

  async topProveedores(filtros = {}, limite = 5) {
    return { data: await reporteCompraRepository.topProveedores(filtros, limite) };
  }

  async productosMasComprados(filtros = {}, limite = 10) {
    return { data: await reporteCompraRepository.productosMasComprados(filtros, limite) };
  }

  async variacionCosto(productoId, filtros = {}) {
    if (!productoId) throw new HttpError(400, 'ID de producto requerido');
    return { data: await reporteCompraRepository.variacionCostoProducto(productoId, filtros) };
  }

  async cuentasPorPagar(filtros = {}) {
    return { data: await reporteCompraRepository.cuentasPorPagar(filtros) };
  }

  async categorias() {
    return { data: await reporteCompraRepository.categorias() };
  }
}

module.exports = new ReporteCompraService();