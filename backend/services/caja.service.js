const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const cajaRepository = require('../repositories/caja.repository');
const cajaDto = require('../dtos/caja.dto');
const { registrarAuditoria } = require('../utils/auditoria');

function resumenConEsperado(sesion, ventas, cobros = {}, devoluciones = {}) {
  const efectivoEsperado = Number(sesion.monto_inicial || 0)
    + Number(ventas.ventas_efectivo || 0)
    + Number(cobros.cobros_efectivo || 0)
    - Number(devoluciones.devoluciones_efectivo || 0);

  return {
    ventas_count: Number(ventas.ventas_count || 0),
    ventas_total: cajaDto.redondear2(ventas.ventas_total),
    ventas_efectivo: cajaDto.redondear2(ventas.ventas_efectivo),
    ventas_tarjeta: cajaDto.redondear2(ventas.ventas_tarjeta),
    ventas_transferencia: cajaDto.redondear2(ventas.ventas_transferencia),
    cobros_count: Number(cobros.cobros_count || 0),
    cobros_total: cajaDto.redondear2(cobros.cobros_total),
    cobros_efectivo: cajaDto.redondear2(cobros.cobros_efectivo),
    cobros_tarjeta: cajaDto.redondear2(cobros.cobros_tarjeta),
    cobros_transferencia: cajaDto.redondear2(cobros.cobros_transferencia),
    devoluciones_count: Number(devoluciones.devoluciones_count || 0),
    devoluciones_total: cajaDto.redondear2(devoluciones.devoluciones_total),
    devoluciones_efectivo: cajaDto.redondear2(devoluciones.devoluciones_efectivo),
    devoluciones_tarjeta: cajaDto.redondear2(devoluciones.devoluciones_tarjeta),
    devoluciones_transferencia: cajaDto.redondear2(
      devoluciones.devoluciones_transferencia
    ),
    efectivo_esperado: cajaDto.redondear2(efectivoEsperado)
  };
}

class CajaService {
  // Filtra el historial por fechas de apertura. Solo valores YYYY-MM-DD;
  // si los parámetros no son válidos se ignoran (sin filtro).
  leerFiltrosFechas(filtros = {}) {
    const patron = /^\d{4}-\d{2}-\d{2}$/;
    const limpios = {};
    const desde = String(filtros.desde || '');
    const hasta = String(filtros.hasta || '');
    if (patron.test(desde)) limpios.desde = desde;
    if (patron.test(hasta)) limpios.hasta = hasta;
    if (limpios.desde && limpios.hasta && limpios.desde > limpios.hasta) {
      return { hasta: limpios.hasta };
    }
    return limpios;
  }

  async obtener(usuarioId, filtros = {}) {
    const actual = await cajaRepository.buscarAbierta(usuarioId);
    let resumen = null;

    if (actual) {
      const [ventas, cobros, devoluciones] = await Promise.all([
        cajaRepository.calcularVentas(actual.fecha_apertura, actual.id),
        cajaRepository.calcularCobros(actual.fecha_apertura, actual.id),
        cajaRepository.calcularDevoluciones(actual.fecha_apertura, actual.id)
      ]);
      resumen = resumenConEsperado(actual, ventas, cobros, devoluciones);
    }

    const historial = await cajaRepository.listarHistorial(
      usuarioId,
      25,
      this.leerFiltrosFechas(filtros)
    );
    return {
      actual: actual ? cajaDto.serializarSesion(actual, resumen) : null,
      historial: historial.map((sesion) =>
        cajaDto.serializarSesion(
          sesion,
          actual && Number(sesion.id) === Number(actual.id) ? resumen : null
        )
      )
    };
  }

  async abrir(usuarioId, datos, filtros = {}) {
    const dto = cajaDto.validarApertura(datos);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [usuarioId]);

      const [abiertas] = await connection.query(
        `SELECT id FROM sesiones_caja
         WHERE usuario_id = ? AND estado = 'abierta'
         LIMIT 1`,
        [usuarioId]
      );
      if (abiertas.length) throw new HttpError(409, 'Ya tiene una caja abierta');

      await connection.query(
        `INSERT INTO sesiones_caja (usuario_id, estado, monto_inicial, fecha_apertura)
         VALUES (?, 'abierta', ?, CURRENT_TIMESTAMP)`,
        [usuarioId, dto.monto_inicial]
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return this.obtener(usuarioId, filtros);
  }

  async cerrar(usuarioId, datos, filtros = {}) {
    const dto = cajaDto.validarCierre(datos);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const actual = await cajaRepository.buscarAbiertaParaActualizar(connection, usuarioId);
      if (!actual) throw new HttpError(409, 'No tiene una caja abierta');

      const [ventas, cobros, devoluciones] = await Promise.all([
        cajaRepository.calcularVentas(actual.fecha_apertura, actual.id, connection),
        cajaRepository.calcularCobros(actual.fecha_apertura, actual.id, connection),
        cajaRepository.calcularDevoluciones(actual.fecha_apertura, actual.id, connection)
      ]);
      const resumen = resumenConEsperado(actual, ventas, cobros, devoluciones);
      const diferencia = cajaDto.redondear2(dto.monto_contado - resumen.efectivo_esperado);
      const diferenciaTarjeta = cajaDto.redondear2(
        dto.monto_contado_tarjeta - resumen.ventas_tarjeta - resumen.cobros_tarjeta
          + resumen.devoluciones_tarjeta
      );
      const diferenciaTransferencia = cajaDto.redondear2(
        dto.monto_contado_transferencia - resumen.ventas_transferencia
          - resumen.cobros_transferencia + resumen.devoluciones_transferencia
      );

      const afectadas = await cajaRepository.cerrar(connection, actual.id, {
        ...resumen,
        monto_contado: dto.monto_contado,
        monto_contado_tarjeta: dto.monto_contado_tarjeta,
        monto_contado_transferencia: dto.monto_contado_transferencia,
        diferencia,
        arqueo_detalle: dto.arqueo_detalle,
        observaciones: dto.observaciones
      });
      if (!afectadas) throw new HttpError(409, 'La caja ya fue cerrada');

      await connection.commit();

      await registrarAuditoria(connection, {
        usuario_id: usuarioId,
        accion: 'caja.cerrar',
        entidad: 'sesiones_caja',
        entidad_id: String(actual.id),
        descripcion: `Cierre de caja con diferencia de Q${diferencia.toFixed(2)}`,
        datos: {
          monto_inicial: Number(actual.monto_inicial || 0),
          efectivo_esperado: resumen.efectivo_esperado,
          monto_contado: dto.monto_contado,
          diferencia,
          diferencia_tarjeta: diferenciaTarjeta,
          diferencia_transferencia: diferenciaTransferencia,
          observaciones: dto.observaciones
        }
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return this.obtener(usuarioId, filtros);
  }
}

module.exports = new CajaService();
