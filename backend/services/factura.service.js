const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const facturaRepository = require('../repositories/factura.repository');
const productoRepository = require('../repositories/producto.repository');
const secuenciaRepository = require('../repositories/secuencia.repository');
const configuracionRepository = require('../repositories/configuracion-empresa.repository');
const configuracionDto = require('../dtos/configuracion-empresa.dto');
const facturaDto = require('../dtos/factura.dto');

function sumarDias(fecha, dias) {
  const date = new Date(`${fecha}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(dias || 0));
  return date.toISOString().slice(0, 10);
}

function costoProducto(producto) {
  const promedio = Number(producto.costo_promedio || 0);
  if (promedio > 0) return facturaDto.redondear4(promedio);
  return facturaDto.redondear4(producto.costo_ultimo || 0);
}

class FacturaService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await facturaRepository.listar({
      q: typeof filtros.q === 'string' ? filtros.q.trim() : '',
      cliente: filtros.cliente,
      estado: filtros.estado,
      estado_pago: filtros.estado_pago,
      startDate: filtros.startDate || filtros.fechaInicio,
      endDate: filtros.endDate || filtros.fechaFin,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: facturaDto.serializarLista(rows), total, page, pageSize };
  }

  async resumen() {
    return await facturaRepository.resumen();
  }

  async detalle(id) {
    const fila = await facturaRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Factura no encontrada');
    const detalles = await facturaRepository.obtenerDetalles(id);
    return facturaDto.serializarDetalle(fila, detalles);
  }

  async productos(q, limite) {
    const busqueda = typeof q === 'string' ? q.trim() : '';
    if (!busqueda) return [];
    const cantidad = Math.max(1, Math.min(Number(limite) || 10, 50));
    const filas = await facturaRepository.listarProductos({ q: busqueda, limite: cantidad });
    return filas.map(facturaDto.serializarProductoVenta);
  }

  async impresion(id) {
    const fila = await facturaRepository.buscarImpresionPorId(id);
    if (!fila) throw new HttpError(404, 'Factura no encontrada');
    const [detalles, empresa] = await Promise.all([
      facturaRepository.obtenerDetalles(id),
      configuracionRepository.obtener()
    ]);
    return {
      empresa: configuracionDto.serializar(empresa),
      factura: facturaDto.serializarDetalle(fila, detalles)
    };
  }

  async crear(datos, usuarioId) {
    const dto = facturaDto.validarCrear(datos);
    const cliente = await facturaRepository.buscarCliente(null, dto.cliente_id);
    if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
    if (cliente.estado !== 'activo') throw new HttpError(409, 'El cliente está inactivo');

    if (dto.condicion === 'credito' && !dto.fecha_vencimiento) {
      dto.fecha_vencimiento =
        Number(cliente.dias_credito) > 0
          ? sumarDias(dto.fecha, cliente.dias_credito)
          : dto.fecha;
    }

    const totales = facturaDto.calcularTotales(dto.detalles);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);

      const clienteActual = await facturaRepository.buscarCliente(connection, dto.cliente_id);
      if (!clienteActual) throw new HttpError(404, 'Cliente no encontrado');
      if (clienteActual.estado !== 'activo') throw new HttpError(409, 'El cliente está inactivo');

      const productosPorId = new Map();
      for (const detalle of totales.detalles) {
        const producto = await facturaRepository.buscarProductoParaFactura(
          connection,
          detalle.producto_id
        );
        if (!producto) {
          throw new HttpError(404, `Producto ID ${detalle.producto_id} no encontrado`);
        }
        if (!Number(producto.activo)) {
          throw new HttpError(409, `El producto "${producto.nombre}" está inactivo`);
        }
        if (producto.tipo !== 'servicio') {
          const stock = Number(producto.stock_actual || 0);
          if (stock < Number(detalle.cantidad)) {
            throw new HttpError(
              409,
              `Stock insuficiente para "${producto.nombre}". Disponible: ${stock.toFixed(3)}`
            );
          }
        }
        productosPorId.set(Number(producto.id), producto);
      }

      const numero = await secuenciaRepository.obtenerNumero(connection, {
        nombre: 'facturas',
        prefijo: 'FAC',
        anio: Number(dto.fecha.slice(0, 4))
      });

      const pagada = dto.condicion === 'contado' || totales.total === 0;
      const facturaId = await facturaRepository.crear(connection, {
        numero,
        cliente_id: clienteActual.id,
        cliente_nombre: clienteActual.nombre,
        cliente_nit: clienteActual.nit,
        cliente_telefono: clienteActual.telefono,
        cliente_correo: clienteActual.correo,
        cliente_direccion: clienteActual.direccion,
        fecha: dto.fecha,
        condicion: dto.condicion,
        fecha_vencimiento: dto.condicion === 'credito' ? dto.fecha_vencimiento : null,
        subtotal: totales.subtotal,
        iva: totales.iva,
        total: totales.total,
        monto_pagado: dto.condicion === 'contado' ? totales.total : 0,
        saldo_pendiente: dto.condicion === 'contado' ? 0 : totales.total,
        estado: 'emitida',
        estado_pago: pagada ? 'pagada' : 'pendiente',
        notas: dto.notas,
        usuario_id: usuarioId
      });

      const detallesCompletos = totales.detalles.map((detalle) => {
        const producto = productosPorId.get(Number(detalle.producto_id));
        return {
          producto_id: producto.id,
          producto_codigo: producto.codigo,
          producto_nombre: producto.nombre,
          unidad_medida: producto.unidad_medida,
          tipo: producto.tipo,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          costo_unitario: costoProducto(producto),
          subtotal: detalle.subtotal
        };
      });

      await facturaRepository.crearDetalles(connection, facturaId, detallesCompletos);

      for (const detalle of detallesCompletos) {
        if (detalle.tipo === 'servicio') continue;
        await productoRepository.registrarMovimiento(connection, {
          producto_id: detalle.producto_id,
          tipo: 'salida',
          origen: 'venta',
          referencia_tipo: 'facturas',
          referencia_id: facturaId,
          cantidad: detalle.cantidad,
          costo_unitario: detalle.costo_unitario,
          motivo: 'Venta',
          referencia: numero,
          notas: `Salida por factura de venta ${numero}`,
          usuario_id: usuarioId
        });
      }

      await connection.commit();
      return { id: facturaId, numero };
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        throw new HttpError(409, 'No se pudo generar un número de factura único');
      }
      if (err.sqlState === '45000' || err.code === 'STOCK_INSUFICIENTE') {
        throw new HttpError(409, err.sqlMessage || err.message);
      }
      throw err;
    } finally {
      connection.release();
    }
  }

  async anular(id, usuarioId, datos) {
    const { motivo } = facturaDto.validarAnulacion(datos);
    const factura = await facturaRepository.buscarPorId(id);
    if (!factura) throw new HttpError(404, 'Factura no encontrada');
    if (factura.estado === 'anulada') throw new HttpError(409, 'La factura ya está anulada');

    const detalles = await facturaRepository.obtenerParaAnular(id);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query('SET @usuario_id = ?', [usuarioId]);

      for (const detalle of detalles) {
        if (detalle.tipo === 'servicio') continue;
        await productoRepository.registrarMovimiento(connection, {
          producto_id: detalle.producto_id,
          tipo: 'entrada',
          origen: 'anulacion_venta',
          referencia_tipo: 'facturas',
          referencia_id: id,
          cantidad: detalle.cantidad,
          costo_unitario: Number(detalle.costo_unitario || 0),
          motivo: 'Anulación de venta',
          referencia: factura.numero,
          notas: `Reverso por anulación de factura ${factura.numero}`,
          usuario_id: usuarioId
        });
      }

      const afectadas = await facturaRepository.anular(connection, id, usuarioId, motivo);
      if (!afectadas) throw new HttpError(409, 'La factura ya no se puede anular');

      await connection.commit();
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
}

module.exports = new FacturaService();
