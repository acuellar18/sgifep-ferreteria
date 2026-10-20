const { HttpError } = require('../utils/http-error');
const { ReporteInventarioRepository, DIAS_SIN_MOVIMIENTO } = require('../repositories/reporte-inventario.repository');
const reporteInventarioDto = require('../dtos/reporte-inventario.dto');

const repositorio = new ReporteInventarioRepository();

class ReporteInventarioService {
  async resumen(filtros = {}) {
    const categoriaId = filtros.categoria ? Number(filtros.categoria) : null;
    if (filtros.categoria && (!Number.isInteger(categoriaId) || categoriaId <= 0)) {
      throw new HttpError(400, 'La categoría seleccionada no es válida');
    }

    const [totales, categorias, stockBajo, sinMovimiento, categoria] = await Promise.all([
      repositorio.totales(filtros),
      repositorio.porCategoria(filtros),
      repositorio.stockBajo(filtros),
      repositorio.sinMovimiento(filtros),
      repositorio.obtenerCategoria(categoriaId)
    ]);

    return reporteInventarioDto.serializar({
      totales,
      categorias,
      stock_bajo: stockBajo,
      sin_movimiento: sinMovimiento,
      categoria,
      dias_sin_movimiento: DIAS_SIN_MOVIMIENTO,
      generado_en: new Date().toISOString()
    });
  }
}

module.exports = new ReporteInventarioService();
