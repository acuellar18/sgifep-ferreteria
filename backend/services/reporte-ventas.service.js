const reporteRepository = require('../repositories/reporte-ventas.repository');
const reporteDto = require('../dtos/reporte-ventas.dto');

class ReporteVentasService {
  async resumen(query = {}) {
    const filtros = reporteDto.validarFiltros(query);
    const [resumen, anuladas, devoluciones, porDia, porMetodo, porCajero, topProductos, ultimas] =
      await Promise.all([
        reporteRepository.resumen(filtros),
        reporteRepository.anuladas(filtros),
        reporteRepository.devoluciones(filtros),
        reporteRepository.porDia(filtros),
        reporteRepository.porMetodo(filtros),
        reporteRepository.porCajero(filtros),
        reporteRepository.topProductos(filtros, query.limite),
        reporteRepository.ultimas(filtros, query.ultimas)
      ]);

    return {
      filtros,
      resumen: reporteDto.serializarResumen(resumen, anuladas, devoluciones),
      por_dia: porDia.map(reporteDto.serializarDia),
      por_metodo: porMetodo.map(reporteDto.serializarMetodo),
      por_cajero: porCajero.map(reporteDto.serializarCajero),
      top_productos: topProductos.map(reporteDto.serializarProducto),
      ultimas: ultimas.map(reporteDto.serializarVenta)
    };
  }

  async cajeros() {
    return (await reporteRepository.cajeros()).map((fila) => ({
      usuario_id: Number(fila.usuario_id),
      nombre: fila.nombre
    }));
  }
}

module.exports = new ReporteVentasService();
