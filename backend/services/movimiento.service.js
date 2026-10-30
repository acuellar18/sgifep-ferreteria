const { HttpError } = require('../utils/http-error');
const movimientoRepository = require('../repositories/movimiento.repository');
const movimientoDto = require('../dtos/movimiento.dto');

const TIPOS = new Set(['entrada', 'salida', 'ajuste']);

function validarFecha(valor, nombreCampo) {
  if (!valor) return null;
  const texto = String(valor).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto) || Number.isNaN(Date.parse(texto))) {
    throw new HttpError(400, `${nombreCampo} no es una fecha válida`);
  }
  return texto;
}

function numero(valor) {
  return Number(valor || 0);
}

class MovimientoService {
  async listar(filtros = {}) {
    const tipo = filtros.tipo ? String(filtros.tipo).toLowerCase() : '';
    if (tipo && !TIPOS.has(tipo)) {
      throw new HttpError(400, 'El tipo de movimiento no es válido');
    }

    const { rows, total, page, pageSize } = await movimientoRepository.listar({
      q: typeof filtros.q === 'string' ? filtros.q.trim() : '',
      tipo,
      fechaDesde: validarFecha(filtros.fecha_desde, 'La fecha desde'),
      fechaHasta: validarFecha(filtros.fecha_hasta, 'La fecha hasta'),
      usuario: typeof filtros.usuario === 'string' ? filtros.usuario.trim() : '',
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });

    return {
      data: movimientoDto.serializarLista(rows),
      total,
      page,
      pageSize
    };
  }

  async resumen() {
    const { totales, ultimo } = await movimientoRepository.resumenMes();
    const ahora = new Date();

    return {
      mes: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`,
      entradas: {
        movimientos: numero(totales.entradas),
        unidades: numero(totales.entradas_unidades)
      },
      salidas: {
        movimientos: numero(totales.salidas),
        unidades: numero(totales.salidas_unidades)
      },
      ajustes: {
        movimientos: numero(totales.ajustes),
        unidades: numero(totales.ajustes_unidades)
      },
      ultimo: movimientoDto.serializar(ultimo)
    };
  }

  async registrar(datos, usuarioId) {
    const dto = movimientoDto.validarCrear(datos);

    const producto = await movimientoRepository.buscarProducto(dto.producto_id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');
    if (!producto.activo) {
      throw new HttpError(409, 'El producto está inactivo y no admite movimientos');
    }
    if (producto.tipo === 'servicio') {
      throw new HttpError(409, 'Los servicios no controlan existencias');
    }

    const stockActual = numero(producto.stock_actual);
    if (dto.tipo === 'salida' && stockActual < dto.cantidad) {
      throw new HttpError(409, 'Stock insuficiente para registrar la salida');
    }
    if (dto.tipo === 'ajuste' && Math.abs(dto.cantidad - stockActual) < 0.0005) {
      throw new HttpError(409, 'El nuevo stock debe ser diferente al stock actual');
    }

    try {
      const fila = await movimientoRepository.registrar({
        ...dto,
        usuario_id: usuarioId
      });
      return movimientoDto.serializar(fila);
    } catch (error) {
      if (error.sqlState === '45000') {
        throw new HttpError(409, error.sqlMessage || 'No se pudo registrar el movimiento');
      }
      throw error;
    }
  }
}

module.exports = new MovimientoService();
