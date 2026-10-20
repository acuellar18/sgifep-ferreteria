const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const compraRepository = require('../repositories/compra.repository');
const proveedorRepository = require('../repositories/proveedor.repository');
const productoRepository = require('../repositories/producto.repository');
const ordenCompraRepository = require('../repositories/orden-compra.repository');
const secuenciaRepository = require('../repositories/secuencia.repository');
const compraDto = require('../dtos/compra.dto');

class CompraService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await compraRepository.listar({
      q: filtros.q,
      proveedor: filtros.proveedor,
      estado_pago: filtros.estado_pago,
      estado: filtros.estado,
      startDate: filtros.startDate || filtros.fechaInicio,
      endDate: filtros.endDate || filtros.fechaFin,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: compraDto.serializarLista(rows), total, page, pageSize };
  }

  async resumenes(filtros = {}) {
    const proveedor_id = filtros.proveedor ? Number(filtros.proveedor) : null;
    const [mes, porPagar, semana] = await Promise.all([
      compraRepository.listarResumenMes(proveedor_id),
      compraRepository.listarResumenPorPagar(proveedor_id),
      compraRepository.listarResumenSemana(proveedor_id)
    ]);
    return { data: { comprado_mes: mes, total_por_pagar: porPagar, compras_semana: semana } };
  }

  async detalle(id) {
    const fila = await compraRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Compra no encontrada');
    const [detalles, pagos] = await Promise.all([
      compraRepository.obtenerDetalles(id),
      compraRepository.obtenerPagos(id)
    ]);
    return compraDto.serializarDetalle(fila, detalles, pagos);
  }

  async crear(datos, usuarioId) {
    const dto = compraDto.validarCrear(datos);

    // Verificar proveedor existe y está activo
    const proveedor = await proveedorRepository.buscarPorId(dto.proveedor_id);
    if (!proveedor) throw new HttpError(404, 'Proveedor no encontrado');
    if (!proveedor.activo) throw new HttpError(400, 'El proveedor está inactivo');

    // Verificar factura duplicada
    if (dto.numero_factura) {
      const dup = await compraRepository.buscarPorNumeroFactura(dto.proveedor_id, dto.numero_factura);
      if (dup) throw new HttpError(409, 'Ya existe una compra con ese número de factura para este proveedor');
    }

    // Calcular fecha de vencimiento si es crédito y no viene
    if (dto.condicion === 'credito' && !dto.fecha_vencimiento && proveedor.dias_credito > 0) {
      const fecha = new Date(dto.fecha);
      fecha.setDate(fecha.getDate() + proveedor.dias_credito);
      dto.fecha_vencimiento = fecha.toISOString().split('T')[0];
    }

    // Calcular totales
    const { subtotal, iva, total } = compraDto.calcularTotales(dto.detalles);

    // Validar productos existen y están activos
    const productosIds = [...new Set(dto.detalles.map(d => d.producto_id))];
    for (const pid of productosIds) {
      const prod = await productoRepository.buscarPorId(pid);
      if (!prod) throw new HttpError(404, `Producto ID ${pid} no encontrado`);
      if (!prod.activo) throw new HttpError(400, `El producto "${prod.nombre}" está inactivo`);
    }

    // Verificar orden de compra si se proporciona
    if (dto.orden_compra_id) {
      const orden = await ordenCompraRepository.buscarPorId(dto.orden_compra_id);
      if (!orden) throw new HttpError(404, 'Orden de compra no encontrada');
      if (orden.proveedor_id !== dto.proveedor_id) {
        throw new HttpError(400, 'La orden de compra no pertenece a este proveedor');
      }
      if (orden.estado === 'cancelada') throw new HttpError(400, 'La orden de compra está cancelada');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);

      const numero = await secuenciaRepository.obtenerNumero(connection, {
        nombre: 'compras',
        prefijo: 'C',
        anio: Number(dto.fecha.slice(0, 4))
      });

      // 1. Crear compra
      const compraId = await compraRepository.crear(connection, {
        ...dto,
        numero,
        subtotal,
        iva,
        total,
        monto_pagado: dto.condicion === 'contado' ? total : 0,
        saldo_pendiente: dto.condicion === 'contado' ? 0 : total,
        estado_pago: dto.condicion === 'contado' ? 'pagada' : 'pendiente',
        estado: 'recibida',
        usuario_id: usuarioId
      });

      // 2. Crear detalles
      await compraRepository.crearDetalles(connection, compraId, dto.detalles);

      // 3. Registrar la entrada de inventario. El trigger actualiza stock y costo.
      for (const d of dto.detalles) {
        await productoRepository.registrarMovimiento(connection, {
          producto_id: d.producto_id,
          tipo: 'entrada',
          origen: 'compra',
          referencia_tipo: 'compras',
          referencia_id: compraId,
          cantidad: d.cantidad,
          costo_unitario: d.costo_unitario,
          notas: `Entrada por compra ${numero}`,
          usuario_id: usuarioId
        });
        await proveedorRepository.actualizarCostoProductoProveedor(
          d.producto_id,
          dto.proveedor_id,
          d.costo_unitario,
          connection
        );
      }

      // 4. Si es contado, registrar pago automático
      if (dto.condicion === 'contado') {
        await compraRepository.registrarPago(connection, {
          compra_id: compraId,
          fecha: dto.fecha,
          monto: total,
          metodo: 'efectivo',
          referencia: 'Pago automático contado',
          notas: 'Compra al contado',
          usuario_id: usuarioId
        });
      }

      // 5. Si hay orden de compra, actualizar cantidades recibidas y estado
      if (dto.orden_compra_id) {
        await this.actualizarOrdenDesdeCompra(connection, dto.orden_compra_id, dto.detalles);
      }

      await connection.commit();
      return compraId;
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'Número de compra duplicado');
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async actualizarOrdenDesdeCompra(conn, ordenId, detallesCompra) {
    const destino = conn || pool;
    for (const d of detallesCompra) {
      await destino.query(
        `UPDATE detalle_orden_compra
         SET cantidad_recibida = cantidad_recibida + ?
         WHERE orden_id = ? AND producto_id = ?`,
        [d.cantidad, ordenId, d.producto_id]
      );
    }
    await compraRepository.actualizarEstadoOrden(destino, ordenId);
  }

  async anular(id, usuarioId, motivo) {
    if (!motivo || !motivo.trim()) {
      throw new HttpError(400, 'El motivo de anulación es requerido');
    }

    const compra = await compraRepository.buscarPorId(id);
    if (!compra) throw new HttpError(404, 'Compra no encontrada');
    if (compra.estado === 'anulada') throw new HttpError(400, 'La compra ya está anulada');
    if (compra.monto_pagado > 0) {
      throw new HttpError(400, 'No se puede anular una compra con pagos activos. Anule los pagos primero.');
    }

    const detalles = await compraRepository.obtenerParaAnular(id);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);

      // Revertir la entrada de inventario. El trigger valida y actualiza stock.
      for (const d of detalles) {
        await productoRepository.registrarMovimiento(connection, {
          producto_id: d.producto_id,
          tipo: 'salida',
          origen: 'anulacion_compra',
          referencia_tipo: 'compras',
          referencia_id: id,
          cantidad: d.cantidad,
          costo_unitario: 0,
          notas: `Reverso por anulación de compra ${compra.numero}`,
          usuario_id: usuarioId
        });
      }

      // Anular compra
      await compraRepository.anular(connection, id, usuarioId, motivo.trim());

      // Si hay orden de compra, revertir cantidades recibidas
      if (compra.orden_compra_id) {
        for (const d of detalles) {
          await connection.query(
            `UPDATE detalle_orden_compra
             SET cantidad_recibida = GREATEST(0, cantidad_recibida - ?)
             WHERE orden_id = ? AND producto_id = ?`,
            [d.cantidad, compra.orden_compra_id, d.producto_id]
          );
        }
        await compraRepository.actualizarEstadoOrden(connection, compra.orden_compra_id);
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      if (err.code === 'STOCK_INSUFICIENTE' || err.sqlState === '45000') {
        throw new HttpError(400, err.sqlMessage || err.message);
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async registrarPago(compraId, datos, usuarioId) {
    const compra = await compraRepository.buscarPorId(compraId);
    if (!compra) throw new HttpError(404, 'Compra no encontrada');
    if (compra.estado === 'anulada') throw new HttpError(400, 'No se pueden registrar pagos en una compra anulada');

    const monto = Number(datos.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new HttpError(400, 'El monto debe ser mayor a 0');
    }
    const saldoPendiente = Number(compra.saldo_pendiente || 0);
    if (monto > saldoPendiente) {
      throw new HttpError(400, `El monto no puede exceder el saldo pendiente (Q${saldoPendiente.toFixed(2)})`);
    }

    const fecha = datos.fecha ? String(datos.fecha).trim() : new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new HttpError(400, 'La fecha debe tener formato YYYY-MM-DD');
    }

    const metodo = ['efectivo', 'transferencia', 'cheque', 'otro'].includes(datos.metodo) ? datos.metodo : 'efectivo';
    const referencia = typeof datos.referencia === 'string' ? datos.referencia.trim() : '';
    const notas = typeof datos.notas === 'string' ? datos.notas.trim() : '';

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);

      // El trigger de pagos recalcula monto pagado, saldo y estado de la compra.
      await compraRepository.registrarPago(connection, {
        compra_id: compraId,
        fecha,
        monto,
        metodo,
        referencia: referencia || null,
        notas: notas || null,
        usuario_id: usuarioId
      });

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      if (err.sqlState === '45000') {
        throw new HttpError(400, err.sqlMessage || err.message);
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async eliminarPago(pagoId, usuarioId, motivo) {
    const [pagos] = await pool.query(
      `SELECT pp.id, pp.estado, c.estado AS estado_compra
       FROM pagos_compra pp
       JOIN compras c ON c.id = pp.compra_id
       WHERE pp.id = ?`, [pagoId]);
    if (!pagos.length) throw new HttpError(404, 'Pago no encontrado');
    if (pagos[0].estado === 'anulado') throw new HttpError(400, 'El pago ya está anulado');
    if (pagos[0].estado_compra === 'anulada') {
      throw new HttpError(400, 'No se pueden modificar pagos de una compra anulada');
    }

    const motivoAnulacion = String(motivo || '').trim() || 'Anulación de pago';
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);
      await connection.query(
        `UPDATE pagos_compra
         SET estado = 'anulado', anulado_en = CURRENT_TIMESTAMP, anulado_por = ?,
             anulacion_motivo = ?
         WHERE id = ? AND estado = 'activo'`,
        [usuarioId, motivoAnulacion, pagoId]
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      if (err.sqlState === '45000') {
        throw new HttpError(400, err.sqlMessage || err.message);
      }
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new CompraService();