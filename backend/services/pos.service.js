const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const posRepository = require('../repositories/pos.repository');
const cajaRepository = require('../repositories/caja.repository');
const facturaRepository = require('../repositories/factura.repository');
const productoRepository = require('../repositories/producto.repository');
const secuenciaRepository = require('../repositories/secuencia.repository');
const configuracionRepository = require('../repositories/configuracion-empresa.repository');
const configuracionDto = require('../dtos/configuracion-empresa.dto');
const facturaDto = require('../dtos/factura.dto');
const posDto = require('../dtos/pos.dto');
const { registrarAuditoria } = require('../utils/auditoria');

const IVA_FACTOR = facturaDto.IVA_FACTOR;

function costoProducto(producto) {
  const promedio = Number(producto.costo_promedio || 0);
  if (promedio > 0) return facturaDto.redondear4(promedio);
  return facturaDto.redondear4(producto.costo_ultimo || 0);
}

function fechaHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function validarFecha(fecha) {
  return facturaDto.fechaValida(fecha) ? fecha : fechaHoy();
}

class PosService {
  async contexto(usuarioId) {
    const [caja, consumidorFinal, empresa] = await Promise.all([
      cajaRepository.buscarAbierta(usuarioId),
      posRepository.buscarConsumidorFinal(),
      configuracionRepository.obtener()
    ]);

    return {
      caja: caja
        ? {
            id: Number(caja.id),
            monto_inicial: Number(caja.monto_inicial || 0),
            fecha_apertura: caja.fecha_apertura
          }
        : null,
      cliente_predeterminado: posDto.serializarCliente(consumidorFinal),
      empresa: configuracionDto.serializar(empresa)
    };
  }

  async buscarProducto(codigo) {
    const busqueda = typeof codigo === 'string' ? codigo.trim() : '';
    if (!busqueda) throw new HttpError(400, 'Escribe o escanea un código de producto');

    const producto = await posRepository.buscarProductoPorCodigo(busqueda);
    if (!producto) throw new HttpError(404, 'Producto no encontrado o inactivo');
    return posDto.serializarProducto(producto);
  }

  async buscarProductos(q) {
    const busqueda = typeof q === 'string' ? q.trim() : '';
    if (!busqueda) return [];
    const filas = await posRepository.buscarProductos(busqueda, 12);
    return filas.map(posDto.serializarProducto);
  }

  async buscarCliente(nit) {
    const busqueda = typeof nit === 'string' ? nit.trim().toUpperCase() : '';
    if (!busqueda) {
      const cliente = await posRepository.buscarConsumidorFinal();
      return posDto.serializarCliente(cliente);
    }
    const cliente = await posRepository.buscarClientePorNit(null, busqueda);
    return posDto.serializarCliente(cliente);
  }

  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await posRepository.listarVentas({
      desde: filtros.desde,
      hasta: filtros.hasta,
      metodo_pago: filtros.metodo_pago,
      estado: filtros.estado,
      caja_id: filtros.caja_id,
      q: typeof filtros.q === 'string' ? filtros.q.trim() : '',
      page: filtros.page,
      pageSize: filtros.pageSize
    });

    return {
      data: posDto.serializarListaVentas(rows),
      total,
      page,
      pageSize
    };
  }

  async resumen(fecha) {
    const dia = validarFecha(fecha || fechaHoy());
    const fila = await posRepository.resumen(dia);
    return {
      fecha: dia,
      ventas_count: Number(fila.ventas_count || 0),
      total: posDto.redondear2(fila.total),
      ticket_promedio: posDto.redondear2(fila.ticket_promedio),
      efectivo: posDto.redondear2(fila.efectivo),
      tarjeta: posDto.redondear2(fila.tarjeta),
      transferencia: posDto.redondear2(fila.transferencia)
    };
  }

  async detalle(id) {
    const fila = await posRepository.buscarVentaPorId(null, id);
    if (!fila) throw new HttpError(404, 'Venta no encontrada');
    const [detalles, devoluciones] = await Promise.all([
      posRepository.obtenerDetallesVenta(null, id),
      posRepository.listarDevolucionesVenta(id)
    ]);
    const devolucionesCompletas = await Promise.all(
      devoluciones.map(async (devolucion) => {
        const lineas = await posRepository.obtenerDetallesDevolucion(devolucion.id);
        return posDto.serializarDevolucion(devolucion, lineas);
      })
    );
    return {
      ...posDto.serializarDetalle(fila, detalles),
      devoluciones: devolucionesCompletas,
      total_devuelto: posDto.redondear2(
        devolucionesCompletas.reduce((suma, devolucion) => suma + devolucion.total, 0)
      )
    };
  }

  async crear(datos, usuarioId) {
    const dto = posDto.validarCrear(datos);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);

      const caja = await cajaRepository.buscarAbiertaParaActualizar(connection, usuarioId);
      if (!caja) {
        throw new HttpError(409, 'Abre la caja antes de registrar ventas');
      }

      const cliente = await this.resolverCliente(connection, dto.cliente);
      if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
      if (cliente.estado !== 'activo') throw new HttpError(409, 'El cliente está inactivo');

      const lineas = [];
      for (const detalle of dto.detalles) {
        const producto = await posRepository.buscarProductoParaVenta(
          connection,
          detalle.producto_id
        );
        if (!producto) {
          throw new HttpError(404, `Producto ID ${detalle.producto_id} no encontrado`);
        }
        if (!Number(producto.activo)) {
          throw new HttpError(409, `El producto "${producto.nombre}" está inactivo`);
        }

        const precioUnitario = posDto.redondear2(producto.precio_venta);
        const bruto = posDto.redondear2(detalle.cantidad * precioUnitario);
        if (detalle.descuento > bruto) {
          throw new HttpError(
            400,
            `El descuento de "${producto.nombre}" no puede superar ${bruto.toFixed(2)}`
          );
        }

        if (producto.tipo !== 'servicio') {
          const stock = Number(producto.stock_actual || 0);
          if (stock < detalle.cantidad) {
            throw new HttpError(
              409,
              `Stock insuficiente para "${producto.nombre}". Disponible: ${stock.toFixed(3)}`
            );
          }
        }

        lineas.push({
          producto_id: Number(producto.id),
          producto_codigo: producto.codigo,
          producto_nombre: producto.nombre,
          presentacion: producto.presentacion || null,
          unidad_medida: producto.unidad_medida,
          tipo: producto.tipo,
          cantidad: detalle.cantidad,
          precio_unitario: precioUnitario,
          descuento: detalle.descuento,
          subtotal: posDto.redondear2(bruto - detalle.descuento),
          costo_unitario: costoProducto(producto)
        });
      }

      const total = posDto.redondear2(
        lineas.reduce((suma, linea) => suma + linea.subtotal, 0)
      );
      if (total <= 0) {
        throw new HttpError(400, 'El total de la venta debe ser mayor a 0');
      }

      const descuentoTotal = posDto.redondear2(
        lineas.reduce((suma, linea) => suma + linea.descuento, 0)
      );
      const subtotal = posDto.redondear2(total / (1 + IVA_FACTOR));
      const iva = posDto.redondear2(total - subtotal);

      let montoRecibido = dto.monto_recibido;
      if (dto.metodo_pago === 'efectivo') {
        if (montoRecibido === null) {
          throw new HttpError(400, 'El monto recibido es obligatorio para pagos en efectivo');
        }
        if (montoRecibido + 0.001 < total) {
          throw new HttpError(400, 'El monto recibido es menor que el total de la venta');
        }
      } else {
        montoRecibido = total;
      }
      const cambio = dto.metodo_pago === 'efectivo'
        ? posDto.redondear2(Math.max(0, montoRecibido - total))
        : 0;

      const [fechaRows] = await connection.query(
        "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS fecha"
      );
      const fecha = fechaRows[0]?.fecha || fechaHoy();
      const anio = Number(fecha.slice(0, 4));

      const numero = await secuenciaRepository.obtenerNumero(connection, {
        nombre: 'ventas_pos',
        prefijo: 'VEN',
        anio
      });
      const numeroFactura = await secuenciaRepository.obtenerNumero(connection, {
        nombre: 'facturas',
        prefijo: 'FAC',
        anio
      });

      const facturaId = await facturaRepository.crear(connection, {
        numero: numeroFactura,
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre,
        cliente_nit: cliente.nit,
        cliente_telefono: cliente.telefono,
        cliente_correo: cliente.correo,
        cliente_direccion: cliente.direccion,
        fecha,
        condicion: 'contado',
        fecha_vencimiento: null,
        subtotal,
        iva,
        total,
        monto_pagado: total,
        saldo_pendiente: 0,
        estado: 'emitida',
        estado_pago: 'pagada',
        notas: `Venta POS ${numero}`,
        usuario_id: usuarioId
      });

      await facturaRepository.crearDetalles(
        connection,
        facturaId,
        lineas.map((linea) => ({
          producto_id: linea.producto_id,
          producto_codigo: linea.producto_codigo,
          producto_nombre: linea.producto_nombre,
          unidad_medida: linea.unidad_medida,
          tipo: linea.tipo,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio_unitario,
          costo_unitario: linea.costo_unitario,
          subtotal: linea.subtotal
        }))
      );

      for (const linea of lineas) {
        if (linea.tipo === 'servicio') continue;
        await productoRepository.registrarMovimiento(connection, {
          producto_id: linea.producto_id,
          tipo: 'salida',
          origen: 'venta',
          referencia_tipo: 'facturas',
          referencia_id: facturaId,
          cantidad: linea.cantidad,
          costo_unitario: linea.costo_unitario,
          motivo: 'Venta POS',
          referencia: numeroFactura,
          notas: `Salida por venta POS ${numero} (${numeroFactura})`,
          usuario_id: usuarioId
        });
      }

      const ventaId = await posRepository.crearVenta(connection, {
        numero,
        caja_id: caja.id,
        factura_id: facturaId,
        cliente_id: cliente.id,
        usuario_id: usuarioId,
        subtotal,
        iva,
        descuento: descuentoTotal,
        total,
        metodo_pago: dto.metodo_pago,
        monto_recibido: montoRecibido,
        cambio,
        referencia: dto.referencia,
        observaciones: dto.observaciones
      });

      await posRepository.crearDetalleVenta(connection, ventaId, lineas);
      await posRepository.crearCobro(connection, {
        venta_id: ventaId,
        factura_id: facturaId,
        cliente_id: cliente.id,
        usuario_id: usuarioId,
        caja_id: caja.id,
        metodo_pago: dto.metodo_pago,
        monto: total,
        referencia: dto.referencia
      });

      await connection.commit();

      await registrarAuditoria(connection, {
        usuario_id: usuarioId,
        accion: 'pos.venta.crear',
        entidad: 'ventas',
        entidad_id: String(ventaId),
        descripcion: `Venta ${numero} por Q${total.toFixed(2)}`,
        datos: { numero, factura_id: facturaId, metodo_pago: dto.metodo_pago, total }
      });

      const [venta, empresa] = await Promise.all([
        this.detalle(ventaId),
        configuracionRepository.obtener().then(configuracionDto.serializar)
      ]);

      return { venta, empresa };
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'No se pudo generar un número de venta único');
      }
      if (err.sqlState === '45000' || err.code === 'STOCK_INSUFICIENTE') {
        throw new HttpError(409, err.sqlMessage || err.message);
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async resolverCliente(connection, datos) {
    if (datos.cliente_id) {
      return await posRepository.buscarClientePorId(connection, datos.cliente_id);
    }

    if (datos.nit) {
      const existente = await posRepository.buscarClientePorNit(connection, datos.nit);
      if (existente) return existente;
      if (!datos.nombre) {
        throw new HttpError(
          400,
          'El nombre del cliente es requerido para registrarlo con ese NIT'
        );
      }
      const id = await posRepository.crearCliente(connection, datos);
      return await posRepository.buscarClientePorId(connection, id);
    }

    return await posRepository.buscarConsumidorFinal(connection);
  }

  async anular(id, usuarioId, datos) {
    const { motivo } = facturaDto.validarAnulacion(datos);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);

      const venta = await posRepository.buscarVentaParaActualizar(connection, id);
      if (!venta) throw new HttpError(404, 'Venta no encontrada');
      if (venta.estado !== 'completada') {
        throw new HttpError(409, 'La venta ya está anulada');
      }

      const caja = await cajaRepository.buscarPorId(connection, venta.caja_id);
      if (!caja || caja.estado !== 'abierta') {
        throw new HttpError(409, 'No se puede anular una venta de una caja cerrada');
      }

      const detalles = await posRepository.obtenerDetallesVenta(connection, id);
      for (const detalle of detalles) {
        if (detalle.tipo === 'servicio') continue;
        const producto = await posRepository.buscarProductoParaVenta(
          connection,
          detalle.producto_id
        );
        await productoRepository.registrarMovimiento(connection, {
          producto_id: detalle.producto_id,
          tipo: 'entrada',
          origen: 'anulacion_venta',
          referencia_tipo: 'ventas',
          referencia_id: id,
          cantidad: detalle.cantidad,
          costo_unitario: producto ? costoProducto(producto) : 0,
          motivo: 'Anulación de venta POS',
          referencia: venta.numero,
          notas: `Reverso por anulación de venta ${venta.numero}`,
          usuario_id: usuarioId
        });
      }

      if (venta.factura_id) {
        const afectadas = await facturaRepository.anular(
          connection,
          venta.factura_id,
          usuarioId,
          motivo
        );
        if (!afectadas) {
          throw new HttpError(409, 'La factura asociada ya no se puede anular');
        }
      }

      const actualizadas = await posRepository.anularVenta(connection, id, usuarioId, motivo);
      if (!actualizadas) throw new HttpError(409, 'La venta ya no se puede anular');
      await posRepository.anularCobro(connection, id, motivo);

      await connection.commit();

      await registrarAuditoria(connection, {
        usuario_id: usuarioId,
        accion: 'pos.venta.anular',
        entidad: 'ventas',
        entidad_id: String(id),
        descripcion: `Anulación de venta ${venta.numero}`,
        datos: { numero: venta.numero, motivo, total: Number(venta.total || 0) }
      });

      return await this.detalle(id);
    } catch (err) {
      await connection.rollback();
      if (err.sqlState === '45000') {
        throw new HttpError(409, err.sqlMessage || err.message);
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async obtenerCuenta(id) {
    const factura = await facturaRepository.buscarParaCobro(null, id);
    if (!factura) throw new HttpError(404, 'Cuenta por cobrar no encontrada');
    const cobros = await facturaRepository.listarCobros(id);
    return {
      ...facturaDto.serializar(factura),
      cobros: cobros.map(posDto.serializarCobro)
    };
  }

  async registrarPagoCuenta(id, datos, usuarioId) {
    const dto = posDto.validarPagoCredito(datos);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const factura = await facturaRepository.buscarParaCobro(connection, id);
      if (!factura) throw new HttpError(404, 'Cuenta por cobrar no encontrada');
      if (factura.estado !== 'emitida') {
        throw new HttpError(409, 'La factura no está emitida');
      }

      const saldo = posDto.redondear2(Number(factura.saldo_pendiente || 0));
      if (saldo <= 0) throw new HttpError(409, 'La factura ya está pagada');
      if (dto.monto > saldo + 0.009) {
        throw new HttpError(409, `El pago supera el saldo pendiente de Q${saldo.toFixed(2)}`);
      }

      const caja = await cajaRepository.buscarAbiertaParaActualizar(connection, usuarioId);
      if (!caja) {
        throw new HttpError(409, 'Abre la caja antes de registrar cobros');
      }

      const montoPagado = posDto.redondear2(Number(factura.monto_pagado || 0) + dto.monto);
      const saldoPendiente = posDto.redondear2(Math.max(0, saldo - dto.monto));
      const estadoPago = saldoPendiente <= 0.009 ? 'pagada' : 'parcial';

      const afectadas = await facturaRepository.actualizarCobro(connection, id, {
        monto_pagado: montoPagado,
        saldo_pendiente: saldoPendiente,
        estado_pago: estadoPago
      });
      if (!afectadas) throw new HttpError(409, 'No se pudo actualizar la factura');

      const cobroId = await posRepository.crearCobro(connection, {
        factura_id: id,
        venta_id: factura.venta_id || null,
        cliente_id: factura.cliente_id,
        usuario_id: usuarioId,
        caja_id: caja.id,
        metodo_pago: dto.metodo_pago,
        monto: dto.monto,
        referencia: dto.referencia,
        notas: dto.notas
      });

      await connection.commit();

      const [cobro, actualizada] = await Promise.all([
        posRepository.buscarCobroPorId(cobroId),
        facturaRepository.buscarParaCobro(null, id)
      ]);

      await registrarAuditoria(connection, {
        usuario_id: usuarioId,
        accion: 'facturacion.cobro.registrar',
        entidad: 'facturas',
        entidad_id: String(id),
        descripcion: `Cobro de Q${dto.monto.toFixed(2)} a factura ${factura.numero}`,
        datos: {
          factura_id: id,
          cobro_id: cobroId,
          metodo_pago: dto.metodo_pago,
          monto: dto.monto,
          saldo_pendiente: saldoPendiente
        }
      });

      return {
        factura: facturaDto.serializar(actualizada),
        cobro: posDto.serializarCobro(cobro)
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async registrarDevolucion(id, datos, usuarioId) {
    const dto = posDto.validarDevolucion(datos);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const venta = await posRepository.buscarVentaParaActualizar(connection, id);
      if (!venta) throw new HttpError(404, 'Venta no encontrada');
      if (venta.estado !== 'completada') {
        throw new HttpError(409, 'No se puede devolver una venta anulada');
      }

      const caja = await cajaRepository.buscarPorId(connection, venta.caja_id);
      if (!caja || caja.estado !== 'abierta') {
        throw new HttpError(409, 'No se puede devolver una venta de una caja cerrada');
      }

      const detallesVenta = await posRepository.obtenerDetallesVentaParaDevolucion(
        connection,
        id
      );
      const porId = new Map(
        detallesVenta.map((detalle) => [Number(detalle.id), detalle])
      );

      let total = 0;
      let costoTotal = 0;
      const detalles = await Promise.all(dto.detalles.map(async (solicitado) => {
        const detalle = porId.get(solicitado.detalle_venta_id);
        if (!detalle) {
          throw new HttpError(400, 'El detalle no pertenece a la venta');
        }

        const cantidadOriginal = Number(detalle.cantidad || 0);
        const devuelto = Number(detalle.devuelto || 0);
        const disponible = posDto.redondear3(cantidadOriginal - devuelto);
        if (solicitado.cantidad > disponible + 0.0001) {
          throw new HttpError(
            409,
            `Solo puedes devolver ${disponible} de ${detalle.producto_nombre}`
          );
        }

        const proporcion = cantidadOriginal > 0
          ? solicitado.cantidad / cantidadOriginal
          : 0;
        const subtotal = posDto.redondear2(Number(detalle.subtotal || 0) * proporcion);
        const descuento = posDto.redondear2(Number(detalle.descuento || 0) * proporcion);

        const producto = await posRepository.buscarProductoParaVenta(
          connection,
          detalle.producto_id
        );
        const costoUnitario = producto ? costoProducto(producto) : 0;

        total = posDto.redondear2(total + subtotal);
        costoTotal = posDto.redondear2(costoTotal + costoUnitario * solicitado.cantidad);

        return {
          detalle_venta_id: detalle.id,
          producto_id: detalle.producto_id,
          producto_codigo: detalle.producto_codigo,
          producto_nombre: detalle.producto_nombre,
          tipo: detalle.tipo,
          cantidad: solicitado.cantidad,
          precio_unitario: Number(detalle.precio_unitario || 0),
          descuento,
          subtotal,
          costo_unitario: costoUnitario,
          producto
        };
      }));

      if (total <= 0) {
        throw new HttpError(400, 'El total de la devolución debe ser mayor a 0');
      }

      const subtotal = posDto.redondear2(total / 1.12);
      const iva = posDto.redondear2(total - subtotal);
      const numero = await this.generarNumeroDevolucion(connection);
      const devolucionId = await posRepository.crearDevolucion(connection, {
        numero,
        venta_id: id,
        factura_id: venta.factura_id,
        cliente_id: venta.cliente_id,
        usuario_id: usuarioId,
        caja_id: venta.caja_id,
        tipo: dto.tipo,
        metodo_pago: dto.metodo_pago,
        subtotal,
        iva,
        total,
        motivo: dto.motivo
      });

      await posRepository.crearDetalleDevolucion(
        connection,
        devolucionId,
        detalles.map(({ producto, ...detalle }) => detalle)
      );

      for (const detalle of detalles) {
        if (detalle.tipo === 'servicio') continue;
        await productoRepository.registrarMovimiento(connection, {
          producto_id: detalle.producto_id,
          tipo: 'entrada',
          origen: 'devolucion_venta',
          referencia_tipo: 'devoluciones_venta',
          referencia_id: devolucionId,
          cantidad: detalle.cantidad,
          costo_unitario: detalle.costo_unitario,
          motivo: `Devolución de venta ${venta.numero}`,
          referencia: numero,
          notas: dto.motivo,
          usuario_id: usuarioId
        });
      }

      if (venta.factura_id) {
        const factura = await facturaRepository.buscarParaCobro(
          connection,
          venta.factura_id
        );
        if (factura && factura.estado === 'emitida') {
          const totalFactura = posDto.redondear2(Math.max(0, Number(factura.total) - total));
          const montoPagado = posDto.redondear2(
            Math.min(Number(factura.monto_pagado || 0), totalFactura)
          );
          const saldoPendiente = posDto.redondear2(
            Math.max(0, totalFactura - montoPagado)
          );
          const estadoPago = saldoPendiente <= 0.009
            ? (totalFactura > 0 ? 'pagada' : 'pagada')
            : (montoPagado > 0 ? 'parcial' : 'pendiente');

          await facturaRepository.actualizarTotalesDevolucion(connection, factura.id, {
            subtotal: posDto.redondear2(Math.max(0, Number(factura.subtotal) - subtotal)),
            iva: posDto.redondear2(Math.max(0, Number(factura.iva) - iva)),
            total: totalFactura,
            monto_pagado: montoPagado,
            saldo_pendiente: saldoPendiente,
            estado_pago: estadoPago
          });
        }
      }

      await connection.commit();

      await registrarAuditoria(connection, {
        usuario_id: usuarioId,
        accion: 'pos.devolucion.registrar',
        entidad: 'devoluciones_venta',
        entidad_id: String(devolucionId),
        descripcion: `Devolución ${numero} de venta ${venta.numero} por Q${total.toFixed(2)}`,
        datos: {
          venta_id: id,
          numero,
          tipo: dto.tipo,
          metodo_pago: dto.metodo_pago,
          total,
          costo_total: costoTotal
        }
      });

      const fila = await posRepository.buscarDevolucionPorId(devolucionId);
      const lineas = await posRepository.obtenerDetallesDevolucion(devolucionId);
      return posDto.serializarDevolucion(fila, lineas);
    } catch (err) {
      await connection.rollback();
      if (err.sqlState === '45000') {
        throw new HttpError(409, err.sqlMessage || err.message);
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async generarNumeroDevolucion(connection) {
    const anio = new Date().getFullYear();
    const prefijo = `DEV-${anio}-`;
    const [rows] = await connection.query(
      `SELECT numero
       FROM devoluciones_venta
       WHERE numero LIKE ?
       ORDER BY numero DESC
       LIMIT 1
       FOR UPDATE`,
      [`${prefijo}%`]
    );
    const ultimo = rows[0]?.numero || '';
    const secuencia = Number(ultimo.slice(prefijo.length)) || 0;
    return `${prefijo}${String(secuencia + 1).padStart(6, '0')}`;
  }

  async cuentasPorCobrar() {
    const [filas, resumen] = await Promise.all([
      posRepository.listarCuentasPorCobrar(),
      posRepository.resumenCuentasPorCobrar()
    ]);
    return {
      data: filas.map(posDto.serializarCuenta),
      resumen: {
        facturas: Number(resumen.facturas || 0),
        total: posDto.redondear2(resumen.total),
        vencido: posDto.redondear2(resumen.vencido)
      }
    };
  }
}

module.exports = new PosService();
