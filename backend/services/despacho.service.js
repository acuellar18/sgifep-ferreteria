const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const repo = require('../repositories/despacho.repository');

const ESTADOS_TRANSICION = {
  pendiente: ['programado', 'cancelado'],
  programado: ['en_ruta', 'cancelado'],
  en_ruta: ['entregado', 'entrega_parcial', 'fallido', 'cancelado'],
  entregado: ['entrega_parcial'],
  entrega_parcial: ['entregado', 'cancelado'],
  fallido: ['programado'],
  cancelado: []
};

function transicionValida(de, a) {
  return (ESTADOS_TRANSICION[de] || []).includes(a);
}

function formatearCodigo(id) {
  return `DSP-${String(id).padStart(6, '0')}`;
}

class DespachoService {
  async crear(datos, usuarioId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Validar que la venta/factura exista y tenga cliente
      const [ventas] = await conn.query('SELECT id, cliente_id FROM facturas WHERE id = ? LIMIT 1', [datos.venta_id || null]);
      if (datos.venta_id && (!ventas || !ventas.length)) throw new HttpError(404, 'Venta/factura no encontrada');
      const clienteId = datos.cliente_id || (ventas && ventas[0] ? ventas[0].cliente_id : null);
      if (!clienteId) throw new HttpError(400, 'Debe indicar un cliente o una venta válida');

      // Validar que detalles no excedan vendido menos ya despachado
      const detalles = (datos.detalles || []).filter((d) => d.producto_id || d.cantidad);
      if (detalles.length) {
        for (const d of detalles) {
          if (!d.producto_id || !d.cantidad || d.cantidad <= 0) throw new HttpError(400, 'Cada línea requiere producto y cantidad > 0');
        }
      }

      const estadoInicial = datos.estado || 'pendiente';
      const [res] = await repo.crear(conn, {
        ...datos,
        cliente_id: clienteId,
        estado: estadoInicial,
        usuario_id: usuarioId
      });
      const despachoId = res.insertId;

      // Formatear código
      await conn.query('UPDATE despachos SET codigo = ? WHERE id = ?', [formatearCodigo(despachoId), despachoId]);

// Insertar detalle
      if (detalles.length) {
        for (const d of detalles) {
          await conn.query(
            'INSERT INTO despacho_detalle (despacho_id, producto_id, cantidad, subtotal, entregado) VALUES (?, ?, ?, ?, ?)',
            [despachoId, d.producto_id, d.cantidad, Math.round(d.cantidad * (d.precio_unitario || 0) * 100) / 100, 0]
          );
        }
      }

      // Historial inicial
      await repo.registrarHistorial(conn, despachoId, usuarioId, null, estadoInicial, 'Creación del despacho');

      await conn.commit();
      return { id: despachoId, codigo: formatearCodigo(despachoId) };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async listar(filtros, usuarioId) {
    const [rows] = await repo.listar(filtros);
    const [[count]] = await repo.contar(filtros);
    return { data: rows, total: count.total || 0 };
  }

  async disponiblesParaRuta(filtros = {}) {
    const [rows] = await repo.disponiblesParaRuta(filtros);
    return rows;
  }

  async detalle(id) {
    const [[row]] = await repo.buscarPorId(id);
    if (!row) throw new HttpError(404, 'Despacho no encontrado');
    const [detalles] = await repo.buscarDetalle(id);
    const [historial] = await repo.buscarHistorial(id);
    return { ...row, detalles, historial };
  }

  async actualizarDatos(id, datos, usuarioId) {
    const [[actual]] = await repo.buscarPorId(id);
    if (!actual) throw new HttpError(404, 'Despacho no encontrado');
    if (actual.estado !== 'pendiente' && actual.estado !== 'programado') {
      throw new HttpError(400, 'Solo se puede editar cuando está pendiente o programado');
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

  async cambiarEstado(id, nuevoEstado, usuarioId, comentario = '') {
    const [[actual]] = await repo.buscarPorId(id);
    if (!actual) throw new HttpError(404, 'Despacho no encontrado');
    if (!transicionValida(actual.estado, nuevoEstado)) throw new HttpError(400, `No se puede pasar de ${actual.estado} a ${nuevoEstado}`);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await repo.actualizarEstado(conn, id, nuevoEstado, usuarioId);
      if (nuevoEstado === 'entregado' || nuevoEstado === 'entrega_parcial' || nuevoEstado === 'fallido') {
        await repo.actualizarFechaEntregado(conn, id, new Date());
      }
      await repo.registrarHistorial(conn, id, usuarioId, actual.estado, nuevoEstado, comentario);
      await conn.commit();
      return { id, estado: nuevoEstado };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async cancelar(id, motivo, usuarioId) {
    if (!motivo || !motivo.trim()) throw new HttpError(400, 'Motivo obligatorio para cancelar');
    return this.cambiarEstado(id, 'cancelado', usuarioId, `Cancelado: ${motivo.trim()}`);
  }
};

module.exports = new DespachoService();
