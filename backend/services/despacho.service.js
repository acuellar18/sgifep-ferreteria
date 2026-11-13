const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const repo = require('../repositories/despacho.repository');
const facturaRepository = require('../repositories/factura.repository');
const posRepository = require('../repositories/pos.repository');
const cajaRepository = require('../repositories/caja.repository');
const posDto = require('../dtos/pos.dto');
const { registrarAuditoria } = require('../utils/auditoria');

// Transiciones válidas de estado (la asignación y la entrega usan métodos
// dedicados). Estados terminales: entregado y cancelado.
const ESTADOS_TRANSICION = {
  pendiente: ['cancelado'],
  asignado: ['en_ruta', 'cancelado'],
  en_ruta: ['entregado', 'entrega_parcial', 'no_entregado', 'cancelado'],
  entregado: [],
  entrega_parcial: ['entregado', 'no_entregado', 'cancelado'],
  no_entregado: ['pendiente', 'cancelado'],
  cancelado: []
};

const METODOS_COBRO = ['efectivo', 'tarjeta', 'transferencia'];

function transicionValida(de, a) {
  return (ESTADOS_TRANSICION[de] || []).includes(a);
}

function formatearCodigo(id) {
  return `DSP-${String(id).padStart(6, '0')}`;
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

class DespachoService {
  // Determina si el usuario gestiona todos los despachos (admin/bodega/superadmin).
  esGestorTotal(contexto = {}) {
    if (contexto.superadmin) return true;
    const roles = Array.isArray(contexto.roles) ? contexto.roles : [];
    return roles.includes('administrador') || roles.includes('bodega');
  }

  // El rol reparto solo ve/gestiona los despachos asignados a él.
  esSoloReparto(contexto = {}) {
    if (contexto.superadmin) return false;
    const roles = Array.isArray(contexto.roles) ? contexto.roles : [];
    return roles.includes('reparto') && !this.esGestorTotal(contexto);
  }

  async obtenerConPermiso(id, contexto) {
    const [[despacho]] = await repo.buscarPorId(id);
    if (!despacho) throw new HttpError(404, 'Despacho no encontrado');
    if (this.esSoloReparto(contexto) && Number(despacho.responsable_id) !== Number(contexto.usuarioId)) {
      throw new HttpError(403, 'Solo puedes gestionar los despachos asignados a ti');
    }
    return despacho;
  }

  // Crea el despacho (y su detalle/historial) dentro de una transacción ya abierta.
  // Lo usa el POS para nacer el despacho automáticamente desde la venta.
  async crearDesdeVenta(connection, datos) {
    const [res] = await repo.crear(connection, { ...datos, estado: 'pendiente' });
    const despachoId = res.insertId;
    await connection.query('UPDATE despachos SET codigo = ? WHERE id = ?', [formatearCodigo(despachoId), despachoId]);
    await repo.crearDetalle(connection, despachoId, datos.lineas || []);
    await repo.registrarHistorial(connection, despachoId, datos.usuario_id, null, 'pendiente', 'Creación automática desde el POS');
    return { id: despachoId, codigo: formatearCodigo(despachoId) };
  }

  async crear(datos, contexto) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [ventas] = await conn.query('SELECT id, cliente_id FROM facturas WHERE id = ? LIMIT 1', [datos.venta_id || null]);
      if (datos.venta_id && (!ventas || !ventas.length)) throw new HttpError(404, 'Venta/factura no encontrada');
      const clienteId = datos.cliente_id || (ventas && ventas[0] ? ventas[0].cliente_id : null);
      if (!clienteId) throw new HttpError(400, 'Debe indicar un cliente o una venta válida');

      const detalles = (datos.detalles || []).filter((d) => d.producto_id || d.cantidad);
      if (detalles.length) {
        for (const d of detalles) {
          if (!d.producto_id || !d.cantidad || d.cantidad <= 0) throw new HttpError(400, 'Cada línea requiere producto y cantidad > 0');
        }
      }

      const estadoInicial = 'pendiente';
      const [res] = await repo.crear(conn, {
        ...datos,
        cliente_id: clienteId,
        estado: estadoInicial,
        forma_pago: datos.forma_pago || 'contado',
        costo_envio: datos.costo_envio || 0,
        usuario_id: contexto.usuarioId
      });
      const despachoId = res.insertId;
      await conn.query('UPDATE despachos SET codigo = ? WHERE id = ?', [formatearCodigo(despachoId), despachoId]);

      if (detalles.length) {
        await repo.crearDetalle(conn, despachoId, detalles.map((d) => ({ producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.precio_unitario || 0 })));
      }

      await repo.registrarHistorial(conn, despachoId, contexto.usuarioId, null, estadoInicial, 'Creación manual del despacho');

      await conn.commit();

      await registrarAuditoria(null, {
        usuario_id: contexto.usuarioId,
        accion: 'despacho.crear',
        entidad: 'despachos',
        entidad_id: String(despachoId),
        descripcion: `Despacho ${formatearCodigo(despachoId)} creado manualmente`,
        datos: { codigo: formatearCodigo(despachoId), forma_pago: datos.forma_pago || 'contado' },
        ip: contexto.ip,
        userAgent: contexto.userAgent
      });

      return { id: despachoId, codigo: formatearCodigo(despachoId) };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async listar(filtros, contexto) {
    const filtrosEfectivos = { ...filtros };
    if (this.esSoloReparto(contexto)) {
      filtrosEfectivos.responsableId = contexto.usuarioId;
    }
    const [rows] = await repo.listar(filtrosEfectivos);
    const [[count]] = await repo.contar(filtrosEfectivos);
    return { data: rows, total: count.total || 0 };
  }

  async disponiblesParaRuta(filtros = {}) {
    const [rows] = await repo.disponiblesParaRuta(filtros);
    return rows;
  }

  async detalle(id, contexto) {
    const despacho = await this.obtenerConPermiso(id, contexto);
    const [detalles] = await repo.buscarDetalle(id);
    const [historial] = await repo.buscarHistorial(id);
    return { ...despacho, detalles, historial };
  }

  async listarResponsables() {
    const [rows] = await repo.listarResponsables();
    return rows.map((fila) => ({
      id: Number(fila.id),
      nombre: [fila.nombre, fila.apellido].filter(Boolean).join(' ').trim(),
      username: fila.username,
      es_reparto: Boolean(fila.es_reparto)
    }));
  }

  async actualizarDatos(id, datos, contexto) {
    const actual = await this.obtenerConPermiso(id, contexto);
    if (actual.estado !== 'pendiente' && actual.estado !== 'asignado') {
      throw new HttpError(400, 'Solo se puede editar cuando está pendiente o asignado');
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE despachos SET direccion_entrega = ?, telefono_contacto = ?, fecha_programada = ?, observaciones = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
        [
          datos.direccion_entrega !== undefined ? datos.direccion_entrega : actual.direccion_entrega,
          datos.telefono_contacto !== undefined ? datos.telefono_contacto : actual.telefono_contacto,
          datos.fecha_programada !== undefined ? datos.fecha_programada : actual.fecha_programada,
          datos.observaciones !== undefined ? datos.observaciones : actual.observaciones,
          id
        ]
      );
      await conn.commit();
      return { id };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async asignar(id, datos, contexto) {
    const actual = await this.obtenerConPermiso(id, contexto);
    if (actual.estado !== 'pendiente') throw new HttpError(400, 'Solo se puede asignar un despacho pendiente');

    const responsableId = Number(datos.responsable_id);
    if (!Number.isInteger(responsableId) || responsableId <= 0) {
      throw new HttpError(400, 'Selecciona un responsable de entrega');
    }
    const tipoVehiculo = texto(datos.tipo_vehiculo).toLowerCase();
    if (!['mototaxi', 'motocicleta', 'carro', 'pickup'].includes(tipoVehiculo)) {
      throw new HttpError(400, 'Selecciona un tipo de vehículo válido');
    }
    const placa = texto(datos.placa_vehiculo);
    if (placa.length > 20) throw new HttpError(400, 'La placa no puede superar los 20 caracteres');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await repo.asignar(conn, id, { responsable_id: responsableId, tipo_vehiculo: tipoVehiculo, placa_vehiculo: placa || null });
      await repo.registrarHistorial(conn, id, contexto.usuarioId, 'pendiente', 'asignado', 'Asignación de responsable y vehículo');
      await conn.commit();

      await registrarAuditoria(null, {
        usuario_id: contexto.usuarioId,
        accion: 'despacho.asignar',
        entidad: 'despachos',
        entidad_id: String(id),
        descripcion: `Despacho ${actual.codigo} asignado`,
        datos: { responsable_id: responsableId, tipo_vehiculo: tipoVehiculo, placa_vehiculo: placa || null, de: 'pendiente', a: 'asignado' },
        ip: contexto.ip,
        userAgent: contexto.userAgent
      });

      return { id, estado: 'asignado' };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async cambiarEstado(id, nuevoEstado, contexto, comentario = '') {
    const actual = await this.obtenerConPermiso(id, contexto);
    if (!transicionValida(actual.estado, nuevoEstado)) {
      throw new HttpError(400, `No se puede pasar de ${actual.estado} a ${nuevoEstado}`);
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await repo.actualizarEstado(conn, id, nuevoEstado, contexto.usuarioId);
      if (nuevoEstado === 'entregado') {
        await repo.actualizarFechaEntregado(conn, id, new Date());
      }
      await repo.registrarHistorial(conn, id, contexto.usuarioId, actual.estado, nuevoEstado, comentario);
      await conn.commit();

      await registrarAuditoria(null, {
        usuario_id: contexto.usuarioId,
        accion: 'despacho.cambiar_estado',
        entidad: 'despachos',
        entidad_id: String(id),
        descripcion: `Despacho ${actual.codigo}: ${actual.estado} → ${nuevoEstado}`,
        datos: { de: actual.estado, a: nuevoEstado },
        ip: contexto.ip,
        userAgent: contexto.userAgent
      });

      return { id, estado: nuevoEstado };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async entregar(id, datos, contexto) {
    const despacho = await this.obtenerConPermiso(id, contexto);
    if (despacho.estado !== 'en_ruta' && despacho.estado !== 'entrega_parcial') {
      throw new HttpError(400, 'Solo se puede entregar un despacho en ruta');
    }
    const recibidoPor = texto(datos.recibido_por);
    const observacion = texto(datos.observacion);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Cobro contra entrega: si se indica monto cobrado se registra el pago
      // (requiere caja abierta); si no, la entrega queda registrada y la cuenta
      // por cobrar se liquida después desde cuentas por cobrar.
      if (despacho.forma_pago === 'contra_entrega' && despacho.venta_id) {
        const factura = await facturaRepository.buscarParaCobro(conn, despacho.venta_id);
        const monto = Number(datos.monto_cobrado ?? 0);
        if (factura && factura.estado === 'emitida' && posDto.redondear2(factura.saldo_pendiente) > 0 && Number.isFinite(monto) && monto > 0) {
          const saldo = posDto.redondear2(factura.saldo_pendiente);
          if (monto > saldo + 0.009) {
            throw new HttpError(400, `El monto cobrado supera el saldo pendiente de Q${saldo.toFixed(2)}`);
          }
          const metodoPago = METODOS_COBRO.includes(texto(datos.metodo_pago).toLowerCase())
            ? texto(datos.metodo_pago).toLowerCase()
            : 'efectivo';

          const caja = await cajaRepository.buscarAbiertaParaActualizar(conn, contexto.usuarioId);
          if (!caja) {
            throw new HttpError(409, 'Abre la caja antes de registrar el cobro contra entrega');
          }

          const montoPagado = posDto.redondear2(Number(factura.monto_pagado || 0) + monto);
          const saldoPendiente = posDto.redondear2(Math.max(0, saldo - monto));
          const estadoPago = saldoPendiente <= 0.009 ? 'pagada' : 'parcial';
          await facturaRepository.actualizarCobro(conn, factura.id, {
            monto_pagado: montoPagado,
            saldo_pendiente: saldoPendiente,
            estado_pago: estadoPago
          });
          await posRepository.crearCobro(conn, {
            factura_id: factura.id,
            venta_id: factura.venta_id || null,
            cliente_id: factura.cliente_id,
            usuario_id: contexto.usuarioId,
            caja_id: caja.id,
            metodo_pago: metodoPago,
            monto,
            referencia: datos.referencia || null,
            notas: `Cobro contra entrega ${despacho.codigo}`
          });
        }
      }

      await repo.entregar(conn, id, { recibido_por: recibidoPor || null });
      await repo.registrarHistorial(conn, id, contexto.usuarioId, despacho.estado, 'entregado', observacion || 'Entrega registrada');
      await conn.commit();

      await registrarAuditoria(null, {
        usuario_id: contexto.usuarioId,
        accion: 'despacho.entregar',
        entidad: 'despachos',
        entidad_id: String(id),
        descripcion: `Despacho ${despacho.codigo} entregado`,
        datos: { de: despacho.estado, a: 'entregado', recibido_por: recibidoPor || null },
        ip: contexto.ip,
        userAgent: contexto.userAgent
      });

      return { id, estado: 'entregado' };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async marcarNoEntregado(id, motivo, contexto) {
    const actual = await this.obtenerConPermiso(id, contexto);
    if (actual.estado !== 'en_ruta' && actual.estado !== 'entrega_parcial') {
      throw new HttpError(400, 'Solo se puede marcar no entregado un despacho en ruta');
    }
    if (!motivo || !motivo.trim()) throw new HttpError(400, 'El motivo es obligatorio');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await repo.marcarNoEntregado(conn, id);
      await repo.registrarHistorial(conn, id, contexto.usuarioId, actual.estado, 'no_entregado', `No entregado: ${motivo.trim()}`);
      await conn.commit();

      await registrarAuditoria(null, {
        usuario_id: contexto.usuarioId,
        accion: 'despacho.no_entregado',
        entidad: 'despachos',
        entidad_id: String(id),
        descripcion: `Despacho ${actual.codigo} no entregado`,
        datos: { de: actual.estado, a: 'no_entregado', motivo: motivo.trim() },
        ip: contexto.ip,
        userAgent: contexto.userAgent
      });

      return { id, estado: 'no_entregado' };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async reprogramar(id, fechaProgramada, contexto) {
    const actual = await this.obtenerConPermiso(id, contexto);
    if (actual.estado !== 'no_entregado') {
      throw new HttpError(400, 'Solo se puede reprogramar un despacho no entregado');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto(fechaProgramada))) {
      throw new HttpError(400, 'La nueva fecha programada no es válida');
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await repo.reprogramar(conn, id, fechaProgramada);
      await repo.registrarHistorial(conn, id, contexto.usuarioId, 'no_entregado', 'pendiente', `Reprogramado para ${fechaProgramada}`);
      await conn.commit();
      return { id, estado: 'pendiente' };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async cancelar(id, motivo, contexto) {
    const actual = await this.obtenerConPermiso(id, contexto);
    if (actual.estado === 'entregado' || actual.estado === 'cancelado') {
      throw new HttpError(400, 'No se puede cancelar un despacho entregado o cancelado');
    }
    if (!motivo || !motivo.trim()) throw new HttpError(400, 'Motivo obligatorio para cancelar');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await repo.actualizarEstado(conn, id, 'cancelado', contexto.usuarioId);
      await repo.registrarHistorial(conn, id, contexto.usuarioId, actual.estado, 'cancelado', `Cancelado: ${motivo.trim()}`);
      await conn.commit();

      await registrarAuditoria(null, {
        usuario_id: contexto.usuarioId,
        accion: 'despacho.cancelar',
        entidad: 'despachos',
        entidad_id: String(id),
        descripcion: `Despacho ${actual.codigo} cancelado`,
        datos: { de: actual.estado, a: 'cancelado', motivo: motivo.trim() },
        ip: contexto.ip,
        userAgent: contexto.userAgent
      });

      return { id, estado: 'cancelado' };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // Invocado al anular/devolver una venta POS dentro de su transacción:
  // cancela el despacho si aún no salió a entregar, o lo marca para revisión
  // si ya está en ruta/entregado.
  async anularPorVenta(connection, facturaId, contexto) {
    const [[despacho]] = await repo.buscarPorVenta(facturaId, connection);
    if (!despacho) return null;

    let accion;
    if (despacho.estado === 'en_ruta' || despacho.estado === 'entregado' || despacho.estado === 'entrega_parcial') {
      await repo.marcarParaRevision(connection, despacho.id);
      await repo.registrarHistorial(connection, despacho.id, contexto.usuarioId, despacho.estado, despacho.estado, 'Venta anulada/devuelta: requiere revisión');
      accion = 'revision';
    } else if (despacho.estado !== 'cancelado') {
      await repo.actualizarEstado(connection, despacho.id, 'cancelado', contexto.usuarioId);
      await repo.registrarHistorial(connection, despacho.id, contexto.usuarioId, despacho.estado, 'cancelado', 'Venta anulada/devuelta');
      accion = 'cancelado';
    } else {
      accion = 'sin_cambio';
    }
    return { despacho_id: despacho.id, accion };
  }
}

module.exports = new DespachoService();
