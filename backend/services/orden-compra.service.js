const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const ordenCompraRepository = require('../repositories/orden-compra.repository');
const proveedorRepository = require('../repositories/proveedor.repository');
const productoRepository = require('../repositories/producto.repository');
const secuenciaRepository = require('../repositories/secuencia.repository');

const IVA_FACTOR = 0.12;

function redondear2(valor) {
  return Math.round(valor * 100) / 100;
}

function calcularTotales(detalles) {
  let subtotal = 0;
  for (const d of detalles) {
    subtotal += d.cantidad * d.costo_estimado;
  }
  subtotal = redondear2(subtotal);
  const iva = redondear2(subtotal * IVA_FACTOR);
  const total = redondear2(subtotal + iva);
  return { subtotal, iva, total };
}

function validarDetalles(detalles) {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    throw new HttpError(400, 'Debe agregar al menos un producto a la orden');
  }
  for (let i = 0; i < detalles.length; i++) {
    const d = detalles[i];
    const producto_id = Number(d.producto_id);
    if (!producto_id || !Number.isInteger(producto_id)) {
      throw new HttpError(400, `Línea ${i + 1}: Falta seleccionar un producto`);
    }
    const cantidad = Number(d.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new HttpError(400, `Línea ${i + 1}: La cantidad debe ser mayor a 0`);
    }
    const costo_estimado = Number(d.costo_estimado);
    if (!Number.isFinite(costo_estimado) || costo_estimado < 0) {
      throw new HttpError(400, `Línea ${i + 1}: El costo estimado no puede ser negativo`);
    }
  }
}

class OrdenCompraService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await ordenCompraRepository.listar({
      q: filtros.q,
      proveedor: filtros.proveedor,
      estado: filtros.estado,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: rows.map(this.serializar), total, page, pageSize };
  }

  serializar(fila) {
    if (!fila) return null;
    return {
      id: fila.id,
      numero: fila.numero,
      proveedor_id: fila.proveedor_id,
      proveedor_nombre: fila.proveedor_nombre,
      fecha: fila.fecha,
      fecha_esperada: fila.fecha_esperada,
      estado: fila.estado,
      notas: fila.notas,
      subtotal_estimado: Number(fila.subtotal_estimado || 0),
      iva_estimado: Number(fila.iva_estimado || 0),
      total_estimado: Number(fila.total_estimado || 0),
      usuario_id: fila.usuario_id,
      usuario_nombre: fila.usuario_nombre,
      creado_en: fila.creado_en,
      actualizado_en: fila.actualizado_en
    };
  }

  async detalle(id) {
    const fila = await ordenCompraRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Orden de compra no encontrada');
    const detalles = await ordenCompraRepository.obtenerDetalles(id);
    return {
      ...this.serializar(fila),
      detalles: detalles.map(d => ({
        id: d.id,
        producto_id: d.producto_id,
        codigo: d.codigo,
        nombre: d.nombre,
        unidad_medida: d.unidad_medida,
        stock_actual: Number(d.stock_actual || 0),
        stock_minimo: Number(d.stock_minimo || 0),
        costo_ultimo: Number(d.costo_ultimo || 0),
        cantidad_solicitada: Number(d.cantidad_solicitada || 0),
        cantidad_recibida: Number(d.cantidad_recibida || 0),
        costo_estimado: Number(d.costo_estimado || 0),
        pendiente: Math.max(0, Number(d.cantidad_solicitada || 0) - Number(d.cantidad_recibida || 0))
      }))
    };
  }

  async crear(datos, usuarioId) {
    const proveedor_id = Number(datos.proveedor_id);
    if (!proveedor_id || !Number.isInteger(proveedor_id)) {
      throw new HttpError(400, 'Falta seleccionar un proveedor');
    }

    const proveedor = await proveedorRepository.buscarPorId(proveedor_id);
    if (!proveedor) throw new HttpError(404, 'Proveedor no encontrado');
    if (!proveedor.activo) throw new HttpError(400, 'El proveedor está inactivo');

    const fecha = datos.fecha ? String(datos.fecha).trim() : new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new HttpError(400, 'La fecha debe tener formato YYYY-MM-DD');
    }

    const fecha_esperada = datos.fecha_esperada ? String(datos.fecha_esperada).trim() : null;
    if (fecha_esperada && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_esperada)) {
      throw new HttpError(400, 'La fecha esperada debe tener formato YYYY-MM-DD');
    }

    const estado = 'borrador';
    const notas = typeof datos.notas === 'string' ? datos.notas.trim() : '';

    validarDetalles(datos.detalles);
    const { subtotal, iva, total } = calcularTotales(datos.detalles);

    // Validar productos
    const productosIds = [...new Set(datos.detalles.map(d => d.producto_id))];
    for (const pid of productosIds) {
      const prod = await productoRepository.buscarPorId(pid);
      if (!prod) throw new HttpError(404, `Producto ID ${pid} no encontrado`);
      if (!prod.activo) throw new HttpError(400, `El producto "${prod.nombre}" está inactivo`);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const numero = await secuenciaRepository.obtenerNumero(connection, {
        nombre: 'ordenes_compra',
        prefijo: 'OC',
        anio: Number(fecha.slice(0, 4))
      });

      const ordenId = await ordenCompraRepository.crear(connection, {
        numero, proveedor_id, fecha, fecha_esperada, estado, notas,
        subtotal_estimado: subtotal, iva_estimado: iva, total_estimado: total, usuario_id: usuarioId
      });

      await ordenCompraRepository.crearDetalles(connection, ordenId, datos.detalles);

      await connection.commit();
      return ordenId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async actualizar(id, datos, usuarioId) {
    const orden = await ordenCompraRepository.buscarPorId(id);
    if (!orden) throw new HttpError(404, 'Orden de compra no encontrada');
    if (orden.estado !== 'borrador') {
      throw new HttpError(400, 'Solo se pueden editar órdenes en estado borrador');
    }

    const proveedor_id = Number(datos.proveedor_id);
    const proveedor = await proveedorRepository.buscarPorId(proveedor_id);
    if (!proveedor) throw new HttpError(404, 'Proveedor no encontrado');

    const fecha = datos.fecha ? String(datos.fecha).trim() : orden.fecha;
    const fecha_esperada = datos.fecha_esperada ? String(datos.fecha_esperada).trim() : orden.fecha_esperada;
    const notas = typeof datos.notas === 'string' ? datos.notas.trim() : '';

    validarDetalles(datos.detalles);
    const { subtotal, iva, total } = calcularTotales(datos.detalles);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await ordenCompraRepository.actualizar(connection, id, {
        proveedor_id, fecha, fecha_esperada, estado: orden.estado, notas,
        subtotal_estimado: subtotal, iva_estimado: iva, total_estimado: total
      });

      await ordenCompraRepository.actualizarDetalles(connection, id, datos.detalles);

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async enviar(id, usuarioId) {
    const orden = await ordenCompraRepository.buscarPorId(id);
    if (!orden) throw new HttpError(404, 'Orden de compra no encontrada');
    if (orden.estado !== 'borrador') {
      throw new HttpError(400, 'Solo se pueden enviar órdenes en estado borrador');
    }
    await ordenCompraRepository.cambiarEstado(null, id, 'enviada');
  }

  async cancelar(id, usuarioId) {
    const orden = await ordenCompraRepository.buscarPorId(id);
    if (!orden) throw new HttpError(404, 'Orden de compra no encontrada');
    if (orden.estado === 'recibida' || orden.estado === 'recibida_parcial') {
      throw new HttpError(400, 'No se puede cancelar una orden que ya tiene recepciones');
    }
    await ordenCompraRepository.cambiarEstado(null, id, 'cancelada');
  }

  async recibirMercaderia(ordenId, datos, usuarioId) {
    const orden = await ordenCompraRepository.buscarPorId(ordenId);
    if (!orden) throw new HttpError(404, 'Orden de compra no encontrada');
    if (orden.estado === 'cancelada') throw new HttpError(400, 'La orden está cancelada');
    if (orden.estado === 'recibida') throw new HttpError(400, 'La orden ya fue recibida completamente');

    const detalles = Array.isArray(datos.detalles) ? datos.detalles : [];
    if (detalles.length === 0) throw new HttpError(400, 'Debe indicar al menos un producto a recibir');

    // Validar que los productos coincidan con la orden
    const ordenDetalles = await ordenCompraRepository.obtenerDetalles(ordenId);
    const ordenMap = new Map(ordenDetalles.map(d => [d.producto_id, d]));

    for (const d of detalles) {
      const pid = Number(d.producto_id);
      const ordenDet = ordenMap.get(pid);
      if (!ordenDet) throw new HttpError(400, `El producto ID ${pid} no está en la orden`);
      const recibida = Number(d.cantidad_recibida);
      if (!Number.isFinite(recibida) || recibida < 0) {
        throw new HttpError(400, `Cantidad recibida inválida para ${ordenDet.nombre}`);
      }
      const pendiente = Number(ordenDet.cantidad_solicitada) - Number(ordenDet.cantidad_recibida);
      if (recibida > pendiente) {
        throw new HttpError(400, `La cantidad recibida (${recibida}) excede lo pendiente (${pendiente}) para ${ordenDet.nombre}`);
      }
    }

    // Preparar datos para crear compra
    const detallesCompra = detalles
      .filter(d => Number(d.cantidad_recibida) > 0)
      .map(d => ({
        producto_id: Number(d.producto_id),
        cantidad: Number(d.cantidad_recibida),
        costo_unitario: Number(d.costo_unitario || d.costo_estimado || 0)
      }));

    if (detallesCompra.length === 0) {
      throw new HttpError(400, 'No hay productos con cantidad recibida mayor a 0');
    }

    // Crear compra con los productos recibidos
    const compraData = {
      proveedor_id: orden.proveedor_id,
      fecha: new Date().toISOString().split('T')[0],
      numero_factura: datos.numero_factura || '',
      condicion: datos.condicion || 'credito',
      orden_compra_id: ordenId,
      notas: datos.notas || `Recepción parcial de orden ${orden.numero}`,
      detalles: detallesCompra
    };

    // Usar el servicio de compras para crear la compra
    const compraService = require('./compra.service');
    const compraId = await compraService.crear(compraData, usuarioId);

    return { compraId, mensaje: 'Mercadería recibida y compra registrada correctamente' };
  }

  async stockBajo(proveedorId = null) {
    const productos = await ordenCompraRepository.generarDesdeStockBajo(proveedorId);
    return {
      data: productos.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        unidad_medida: p.unidad_medida,
        stock_actual: Number(p.stock_actual),
        stock_minimo: Number(p.stock_minimo),
        deficit: Number(p.stock_minimo) - Number(p.stock_actual),
        costo_sugerido: Number(p.costo_proveedor || p.costo_ultimo || 0),
        cantidad_sugerida: Math.max(0, Number(p.stock_minimo) * 2 - Number(p.stock_actual)) // Sugerir 2x stock mínimo
      }))
    };
  }

  async eliminar(id) {
    const orden = await ordenCompraRepository.buscarPorId(id);
    if (!orden) throw new HttpError(404, 'Orden de compra no encontrada');
    if (orden.estado !== 'borrador' && orden.estado !== 'cancelada') {
      throw new HttpError(400, 'Solo se pueden eliminar órdenes en borrador o canceladas');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await ordenCompraRepository.eliminar(connection, id);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new OrdenCompraService();