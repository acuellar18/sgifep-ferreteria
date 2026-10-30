const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const repo = require('../repositories/ruta.repository');

const ESTADOS_ACTIVOS = ['planificada', 'en_curso'];

function formatearCodigo(id) {
  return `RTA-${String(id).padStart(6, '0')}`;
}

class RutaService {
  async crear(datos, usuarioId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Regla: conductor o vehículo no pueden tener ruta activa la misma fecha
      if (datos.conductor_id) {
        const [chk] = await conn.query(
          'SELECT id FROM rutas WHERE conductor_id = ? AND fecha = ? AND estado IN (?,?) LIMIT 1',
          [datos.conductor_id, datos.fecha, 'planificada', 'en_curso']
        );
        if (chk && chk.length) throw new HttpError(400, 'El conductor ya tiene una ruta activa en esta fecha');
      }
      if (datos.vehiculo_id) {
        const [chk] = await conn.query(
          'SELECT id FROM rutas WHERE vehiculo_id = ? AND fecha = ? AND estado IN (?,?) LIMIT 1',
          [datos.vehiculo_id, datos.fecha, 'planificada', 'en_curso']
        );
        if (chk && chk.length) throw new HttpError(400, 'El vehículo ya tiene una ruta activa en esta fecha');
      }

      // Cada parada debe ser un despacho programado o pendiente, y no en otra ruta activa
      if (datos.paradas && datos.paradas.length) {
        for (const p of datos.paradas) {
          const [d] = await conn.query('SELECT id, estado FROM despachos WHERE id = ? LIMIT 1', [p.despacho_id]);
          if (!d || !d.length) throw new HttpError(404, `Despacho ${p.despacho_id} no existe`);
          if (d[0].estado !== 'pendiente' && d[0].estado !== 'programado') throw new HttpError(400, `Despacho ${p.despacho_id} debe estar pendiente o programado para la ruta`);
          const [otro] = await conn.query(
            `SELECT rp.id FROM ruta_paradas rp JOIN rutas r ON r.id = rp.ruta_id WHERE rp.despacho_id = ? AND r.estado IN (?,?) AND r.id != ? LIMIT 1`,
            [p.despacho_id, 'planificada', 'en_curso', datos.id || 0]
          );
          if (otro && otro.length) throw new HttpError(400, `Despacho ${p.despacho_id} ya está en una ruta activa`);
        }
      }

      const res = await repo.crear(conn, datos);
      const rutaId = res.insertId;

      // Código
      await conn.query('UPDATE rutas SET codigo = ? WHERE id = ?', [formatearCodigo(rutaId), rutaId]);

      // Paradas ordenadas
      if (datos.paradas && datos.paradas.length) {
        for (let i = 0; i < datos.paradas.length; i++) {
          await repo.crearParada(conn, { ...datos.paradas[i], ruta_id: rutaId, orden: i + 1, estado_parada: 'pendiente' });
        }
      }

      await conn.commit();
      return { id: rutaId, codigo: formatearCodigo(rutaId) };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async listar(filtros) {
    const [rows] = await repo.listar(filtros);
    const [[count]] = await repo.contar(filtros);
    return { data: rows, total: count.total || 0 };
  }

  async detalle(id) {
    const [[row]] = await repo.buscarPorId(id);
    if (!row) throw new HttpError(404, 'Ruta no encontrada');
    const [paradas] = await repo.buscarParadas(id);
    return { ...row, paradas };
  }

  async iniciar(id, usuarioId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[r]] = await repo.buscarPorId(id);
      if (!r) throw new HttpError(404, 'Ruta no encontrada');
      if (r.estado !== 'planificada') throw new HttpError(400, 'Solo se puede iniciar una ruta planificada');
      await repo.actualizarEstado(conn, id, 'en_curso');
      // Pasar despachos asociados a en_ruta
      const [paradas] = await repo.buscarParadas(id);
      for (const p of paradas) {
        await conn.query('UPDATE despachos SET estado = ? WHERE id = ?', ['en_ruta', p.despacho_id]);
        await conn.query('INSERT INTO despacho_historial (despacho_id, usuario_id, de_estado, a_estado, comentario) VALUES (?, ?, ?, ?, ?)',
          [p.despacho_id, usuarioId, 'programado', 'en_ruta', 'Passado a ruta ' + r.codigo]);
      }
      await conn.commit();
      return { id, estado: 'en_curso' };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async registrarEntrega(paradaId, resultado, horaEntrega, recibidoPor, observaciones, motivoFallo, usuarioId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[p]] = await conn.query('SELECT * FROM ruta_paradas WHERE id = ? LIMIT 1', [paradaId]);
      if (!p) throw new HttpError(404, 'Parada no encontrada');
      if (p.estado_parada === 'entregado' || p.estado_parada === 'fallido') throw new HttpError(400, 'Ya registrado');
      await repo.registrarEntrega(conn, paradaId, resultado, horaEntrega, recibidoPor, observaciones, motivoFallo);
      // Actualizar despacho según resultado
      const [d] = await conn.query('SELECT id, estado FROM despachos WHERE id = ? LIMIT 1', [p.despacho_id]);
      if (d && d.length) {
        const nuevoEstadoDespacho = resultado === 'entregado' ? 'entregado' : (resultado === 'entrega_parcial' ? 'entrega_parcial' : (resultado === 'fallido' ? 'fallido' : d[0].estado));
        await conn.query('UPDATE despachos SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [nuevoEstadoDespacho, d[0].id]);
        await conn.query('INSERT INTO despacho_historial (despacho_id, usuario_id, de_estado, a_estado, comentario) VALUES (?, ?, ?, ?, ?)',
          [d[0].id, usuarioId, d[0].estado, nuevoEstadoDespacho, observaciones || `Entrega ${resultado}`]);
      }
      // Verificar si todas las paradas de la ruta tienen resultado
      const [[rutaRow]] = await conn.query('SELECT r.id FROM rutas r WHERE r.id = ? LIMIT 1', [p.ruta_id]);
      const [paradasPend] = await conn.query("SELECT COUNT(*) total FROM ruta_paradas WHERE ruta_id = ? AND estado_parada IN ('pendiente','revisado')", [p.ruta_id]);
      if (paradasPend && paradasPend[0].total === 0) {
        await repo.actualizarEstado(conn, p.ruta_id, 'finalizada');
      }
      await conn.commit();
      return { paradaId, resultado };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async reprogramarFallo(paradaId, nuevaFechaProgramada, usuarioId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[p]] = await conn.query('SELECT * FROM ruta_paradas WHERE id = ? LIMIT 1', [paradaId]);
      if (!p) throw new HttpError(404, 'Parada no encontrada');
      if (p.estado_parada !== 'fallido') throw new HttpError(400, 'Solo se puede reprogramar una parada fallida');
      await conn.query('UPDATE despachos SET estado = ?, fecha_programada = ? WHERE id = ?', ['programado', nuevaFechaProgramada, p.despacho_id]);
      await conn.query('UPDATE despacho_historial SET comentario = ? WHERE despacho_id = ? ORDER BY creado_en DESC LIMIT 1', // simplificado
        [`Reprogramado tras fallo`, p.despacho_id]);
      await conn.query('DELETE FROM ruta_paradas WHERE id = ?', [paradaId]);
      await conn.commit();
      return { paradaId, reprogramado: true };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async cancelar(id, motivo, usuarioId) {
    if (!motivo || !motivo.trim()) throw new HttpError(400, 'Motivo obligatorio');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await repo.actualizarEstado(conn, id, 'cancelada');
      await conn.query('UPDATE despachos SET estado = ? WHERE id IN (SELECT despacho_id FROM ruta_paradas WHERE ruta_id = ?)', ['cancelado', id]);
      await conn.commit();
      return { id, estado: 'cancelada' };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async listarConductores(filtros) { return repo.listarConductores(filtros); }

  async listarVehiculos(filtros) { return repo.listarVehiculos(filtros); }
};

module.exports = new RutaService();
