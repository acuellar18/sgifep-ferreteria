const repo = require('../repositories/reporte-general.repository');
const dto = require('../dtos/reporte-general.dto');

class ReporteGeneralService {
  async obtenerDashboard(query = {}) {
    const filtros = dto.validarFiltros(query);

    const [
      kpis,
      ventasVsCompras,
      topProductos,
      ventasPorVendedor,
      inventarioPorCategoria,
      ultimasVentas,
      ultimasCompras,
      stockBajo,
      movimientos
    ] = await Promise.all([
      repo.kpis(filtros.desde, filtros.hasta),
      repo.ventasVsComprasPorMes(filtros.desde, filtros.hasta),
      repo.topProductosVendidos(filtros.desde, filtros.hasta),
      repo.ventasPorVendedor(filtros.desde, filtros.hasta),
      repo.inventarioPorCategoria(),
      repo.ultimasVentas(filtros.desde, filtros.hasta),
      repo.ultimasCompras(filtros.desde, filtros.hasta),
      repo.productosStockBajo(),
      repo.movimientosRecientes()
    ]);

    return {
      filtros,
      kpis: dto.serializarKpi(kpis),
      ventas_vs_compras: ventasVsCompras,
      top_productos: topProductos,
      ventas_por_vendedor: ventasPorVendedor,
      inventario_por_categoria: inventarioPorCategoria,
      ultimas_ventas: ultimasVentas,
      ultimas_compras: ultimasCompras,
      productos_stock_bajo: stockBajo,
      movimientos_recientes: movimientos
    };
  }
}

module.exports = new ReporteGeneralService();