// Seed de datos de prueba para módulo Compras
// Uso: node seed-compras.js (en backend/)
//
// Requiere haber ejecutado las migraciones 006 y 007. Para reiniciar desde cero
// usar: npm run reiniciar-compras

require('dotenv').config();
const pool = require('./db');
const {
  COMPRAS_SEED,
  redondear2,
  calcularCompra,
  resolverDetallesCompra
} = require('./scripts/lib/compras-seed-data');

const PROVEEDORES = [
  {
    nombre: 'Cementos Progreso S.A.',
    nit: '1234567-8',
    contacto_nombre: 'Juan Pérez',
    telefono: '2345-6789',
    correo: 'ventas@cementosprogreso.com',
    direccion: 'Km 27.5 Carretera a El Salvador',
    dias_credito: 30,
    notas: 'Proveedor principal de cemento y concreto'
  },
  {
    nombre: 'Tuberías y Conexiones del Sur',
    nit: '2345678-9',
    contacto_nombre: 'María González',
    telefono: '2456-7890',
    correo: 'comercial@tuberiasdelsur.com',
    direccion: 'Zona 12, Ciudad de Guatemala',
    dias_credito: 45,
    notas: 'Especialistas en PVC, cobre y galvanizado'
  },
  {
    nombre: 'Pinturas El Color S.A.',
    nit: '3456789-0',
    contacto_nombre: 'Carlos López',
    telefono: '2567-8901',
    correo: 'pedidos@pinturaselcolor.com',
    direccion: 'Calzada Roosevelt 33-50',
    dias_credito: 30,
    notas: 'Pinturas, esmaltes, impermeabilizantes'
  },
  {
    nombre: 'Herramientas Industriales S.A.',
    nit: '4567890-1',
    contacto_nombre: 'Ana Martínez',
    telefono: '2678-9012',
    correo: 'ventas@herramientasindustriales.com',
    direccion: 'Boulevard Los Próceres 15-20',
    dias_credito: 60,
    notas: 'Herramientas manuales y eléctricas, marcas profesionales'
  },
  {
    nombre: 'Electricidad y Cables del Norte',
    nit: '5678901-2',
    contacto_nombre: 'Roberto Sánchez',
    telefono: '2789-0123',
    correo: 'comercial@electricidadnorte.com',
    direccion: '4ta Avenida 10-30 Zona 9',
    dias_credito: 30,
    notas: 'Material eléctrico: cables, breakers, tableros, interruptores'
  }
];

const PRODUCTOS = [
  { codigo: 'CEM-001', nombre: 'Cemento Gris 42.5kg', descripcion: 'Cemento Portland tipo IP', categoria: 'Cemento y Concreto', unidad: 'UNI', stock_min: 50, costo: 75.50, precio: 95.00 },
  { codigo: 'CEM-002', nombre: 'Cemento Blanco 40kg', descripcion: 'Cemento blanco estructural', categoria: 'Cemento y Concreto', unidad: 'UNI', stock_min: 20, costo: 95.00, precio: 120.00 },
  { codigo: 'CON-001', nombre: 'Concreto Premezclado 2500psi m3', descripcion: 'Concreto listo para vaciar', categoria: 'Cemento y Concreto', unidad: 'MTS', stock_min: 5, costo: 850.00, precio: 1100.00 },

  { codigo: 'TUB-001', nombre: 'Tubería PVC 1/2" x 6m', descripcion: 'Tubería PVC sanitaria', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 100, costo: 18.50, precio: 28.00 },
  { codigo: 'TUB-002', nombre: 'Tubería PVC 3/4" x 6m', descripcion: 'Tubería PVC sanitaria', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 80, costo: 25.00, precio: 38.00 },
  { codigo: 'TUB-003', nombre: 'Tubería PVC 1" x 6m', descripcion: 'Tubería PVC sanitaria', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 60, costo: 38.00, precio: 55.00 },
  { codigo: 'CON-002', nombre: 'Codo PVC 1/2" 90°', descripcion: 'Conexión PVC codo 90 grados', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 200, costo: 3.50, precio: 6.00 },
  { codigo: 'CON-003', nombre: 'Tee PVC 1/2"', descripcion: 'Conexión PVC Tee', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 150, costo: 4.20, precio: 7.00 },
  { codigo: 'CON-004', nombre: 'Unión PVC 1/2"', descripcion: 'Conexión PVC unión', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 100, costo: 5.80, precio: 9.00 },

  { codigo: 'PIN-001', nombre: 'Pintura Vinílica Blanca 19L', descripcion: 'Pintura interior/exterior lavable', categoria: 'Pinturas y Recubrimientos', unidad: 'CJA', stock_min: 30, costo: 285.00, precio: 380.00 },
  { codigo: 'PIN-002', nombre: 'Pintura Esmalte Sintético 1L', descripcion: 'Esmalte para metal y madera', categoria: 'Pinturas y Recubrimientos', unidad: 'UNI', stock_min: 50, costo: 45.00, precio: 65.00 },
  { codigo: 'PIN-003', nombre: 'Impermeabilizante Acrílico 19L', descripcion: 'Para techos y muros', categoria: 'Pinturas y Recubrimientos', unidad: 'CJA', stock_min: 20, costo: 320.00, precio: 420.00 },
  { codigo: 'PIN-004', nombre: 'Sellador Silicona 300ml', descripcion: 'Sellador multipropósito', categoria: 'Pinturas y Recubrimientos', unidad: 'UNI', stock_min: 100, costo: 22.00, precio: 35.00 },

  { codigo: 'HER-001', nombre: 'Martillo Carpintero 16oz', descripcion: 'Martillo con mango de fibra', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 30, costo: 55.00, precio: 85.00 },
  { codigo: 'HER-002', nombre: 'Juego Llaves Combinadas 8-19mm', descripcion: '12 piezas, acero cromo vanadio', categoria: 'Herramientas Manuales', unidad: 'CJA', stock_min: 15, costo: 180.00, precio: 280.00 },
  { codigo: 'HER-003', nombre: 'Alicate Universal 8"', descripcion: 'Alicate de corte y presión', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 40, costo: 48.00, precio: 75.00 },
  { codigo: 'HER-004', nombre: 'Destornillador Phillips #2 x 6"', descripcion: 'Punta magnética, mango ergonómico', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 60, costo: 18.00, precio: 30.00 },
  { codigo: 'HER-005', nombre: 'Cinta Métrica 5m', descripcion: 'Cinta métrica con freno', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 50, costo: 25.00, precio: 42.00 },

  { codigo: 'HEL-001', nombre: 'Taladro Percutor 1/2" 650W', descripcion: 'Taladro industrial 2 velocidades', categoria: 'Herramientas Eléctricas', unidad: 'UNI', stock_min: 10, costo: 380.00, precio: 550.00 },
  { codigo: 'HEL-002', nombre: 'Amoladora Angular 4.5"', descripcion: 'Amoladora 750W con disco', categoria: 'Herramientas Eléctricas', unidad: 'UNI', stock_min: 15, costo: 290.00, precio: 420.00 },
  { codigo: 'HEL-003', nombre: 'Sierra Circular 7.25"', descripcion: 'Sierra 1400W con guía láser', categoria: 'Herramientas Eléctricas', unidad: 'UNI', stock_min: 8, costo: 450.00, precio: 650.00 },

  { codigo: 'ELE-001', nombre: 'Cable THHN 12 AWG Negro 100m', descripcion: 'Cable cobre aislado THHN', categoria: 'Material Eléctrico', unidad: 'ROL', stock_min: 20, costo: 420.00, precio: 580.00 },
  { codigo: 'ELE-002', nombre: 'Cable THHN 14 AWG Blanco 100m', descripcion: 'Cable cobre aislado THHN', categoria: 'Material Eléctrico', unidad: 'ROL', stock_min: 20, costo: 280.00, precio: 380.00 },
  { codigo: 'ELE-003', nombre: 'Interruptor Sencillo 15A', descripcion: 'Interruptor residencial blanco', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 100, costo: 8.50, precio: 15.00 },
  { codigo: 'ELE-004', nombre: 'Tomacorriente Duplex 15A', descripcion: 'Contacto doble polarizado', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 100, costo: 12.00, precio: 20.00 },
  { codigo: 'ELE-005', nombre: 'Breaker Termomagnético 20A 2P', descripcion: 'Breaker DIN rail 2 polos', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 30, costo: 85.00, precio: 130.00 },
  { codigo: 'ELE-006', nombre: 'Tablero Carga 12 Circuitos', descripcion: 'Tablero principal residencial', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 10, costo: 320.00, precio: 480.00 }
];

const ASOCIACIONES = [
  { proveedor: 'Cementos Progreso S.A.', productos: ['CEM-001', 'CEM-002', 'CON-001'] },
  { proveedor: 'Tuberías y Conexiones del Sur', productos: ['TUB-001', 'TUB-002', 'TUB-003', 'CON-002', 'CON-003', 'CON-004'] },
  { proveedor: 'Pinturas El Color S.A.', productos: ['PIN-001', 'PIN-002', 'PIN-003', 'PIN-004'] },
  { proveedor: 'Herramientas Industriales S.A.', productos: ['HER-001', 'HER-002', 'HER-003', 'HER-004', 'HER-005', 'HEL-001', 'HEL-002', 'HEL-003'] },
  { proveedor: 'Electricidad y Cables del Norte', productos: ['ELE-001', 'ELE-002', 'ELE-003', 'ELE-004', 'ELE-005', 'ELE-006'] }
];

const ORDENES_SEED = [
  {
    numero: 'OC-2025-000001',
    proveedor_nit: '1234567-8',
    fecha: '2025-02-15',
    fecha_esperada: '2025-02-28',
    estado: 'enviada',
    notas: 'Orden de cemento',
    detalles: [
      { codigo: 'CEM-001', cantidad: 30, costo_unitario: 75.50 },
      { codigo: 'CEM-002', cantidad: 20, costo_unitario: 95.00 }
    ]
  },
  {
    numero: 'OC-2025-000002',
    proveedor_nit: '2345678-9',
    fecha: '2025-02-20',
    fecha_esperada: '2025-03-05',
    estado: 'borrador',
    notas: 'Orden de tuberías pendiente de confirmar',
    detalles: [
      { codigo: 'TUB-001', cantidad: 50, costo_unitario: 18.50 },
      { codigo: 'TUB-002', cantidad: 30, costo_unitario: 25.00 }
    ]
  }
];

async function insertarProveedores(conn) {
  console.log('\n1. Insertando proveedores...');
  for (const p of PROVEEDORES) {
    const [result] = await conn.query(
      `INSERT INTO proveedores
        (nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, 1 FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nit = ?)`,
      [p.nombre, p.nit, p.contacto_nombre, p.telefono, p.correo, p.direccion, p.dias_credito, p.notas, p.nit]
    );
    if (result.affectedRows > 0) console.log(`  + ${p.nombre}`);
  }
}

async function insertarProductos(conn) {
  const [categorias] = await conn.query('SELECT id, nombre FROM categorias');
  const catMap = new Map(categorias.map((c) => [c.nombre, c.id]));

  console.log('\n2. Insertando productos...');
  for (const p of PRODUCTOS) {
    const categoriaId = catMap.get(p.categoria);
    if (!categoriaId) {
      throw new Error(`Categoría no encontrada: ${p.categoria}`);
    }

    const [existentes] = await conn.query(
      'SELECT id FROM productos WHERE codigo = ? LIMIT 1',
      [p.codigo]
    );
    if (existentes.length) continue;

    await conn.query(
      `INSERT INTO productos
        (codigo, nombre, descripcion, categoria_id, unidad_medida, stock_minimo,
         costo_ultimo, costo_promedio, precio_venta, activo, stock_actual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [p.codigo, p.nombre, p.descripcion, categoriaId, p.unidad, p.stock_min, p.costo, p.costo, p.precio]
    );
    console.log(`  + ${p.nombre} (${p.codigo})`);
  }
}

async function asociarProductosProveedor(conn) {
  console.log('\n3. Asociando productos con proveedores...');
  const [proveedores] = await conn.query('SELECT id, nombre FROM proveedores');
  const provMap = new Map(proveedores.map((p) => [p.nombre, p.id]));
  const [productos] = await conn.query('SELECT id, codigo FROM productos');
  const prodMap = new Map(productos.map((p) => [p.codigo, p.id]));

  for (const asociacion of ASOCIACIONES) {
    const proveedorId = provMap.get(asociacion.proveedor);
    if (!proveedorId) continue;

    for (const codigo of asociacion.productos) {
      const productoId = prodMap.get(codigo);
      const producto = PRODUCTOS.find((p) => p.codigo === codigo);
      if (!productoId || !producto) continue;

      await conn.query(
        `INSERT INTO producto_proveedor (producto_id, proveedor_id, costo_ultimo, es_preferido)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE costo_ultimo = VALUES(costo_ultimo), es_preferido = 1`,
        [productoId, proveedorId, producto.costo]
      );
    }
  }
}

async function crearCompraSeed(conn, definicion, usuarioId) {
  const [proveedores] = await conn.query(
    'SELECT id, dias_credito FROM proveedores WHERE nit = ? LIMIT 1',
    [definicion.proveedor_nit]
  );
  if (!proveedores.length) {
    throw new Error(`Proveedor no encontrado para el seed: ${definicion.proveedor_nit}`);
  }

  const [existentes] = await conn.query(
    'SELECT id FROM compras WHERE numero = ? LIMIT 1',
    [definicion.numero]
  );
  if (existentes.length) {
    return { numero: definicion.numero, omitida: true };
  }

  const proveedor = proveedores[0];
  const detalles = await resolverDetallesCompra(conn, definicion);
  const calculo = calcularCompra(definicion, detalles, proveedor.dias_credito);

  const [result] = await conn.query(
    `INSERT INTO compras
      (numero, proveedor_id, fecha, numero_factura, condicion, fecha_vencimiento,
       subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado,
       usuario_id, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibida', ?, ?)`,
    [
      definicion.numero,
      proveedor.id,
      definicion.fecha,
      definicion.numero_factura,
      definicion.condicion,
      calculo.fecha_vencimiento,
      calculo.subtotal,
      calculo.iva,
      calculo.total,
      calculo.monto_pagado,
      calculo.saldo_pendiente,
      calculo.estado_pago,
      usuarioId,
      definicion.notas
    ]
  );
  const compraId = result.insertId;

  for (const d of detalles) {
    const subtotal = redondear2(Number(d.cantidad) * Number(d.costo_unitario));
    await conn.query(
      `INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal)
       VALUES (?, ?, ?, ?, ?)`,
      [compraId, d.producto_id, d.cantidad, d.costo_unitario, subtotal]
    );

    await conn.query(
      `INSERT INTO movimientos_inventario
        (producto_id, tipo, origen, referencia_tipo, referencia_id, cantidad,
         costo_unitario, notas, usuario_id)
       VALUES (?, 'entrada', 'compra', 'compras', ?, ?, ?, ?, ?)`,
      [
        d.producto_id,
        compraId,
        d.cantidad,
        d.costo_unitario,
        `Entrada por compra ${definicion.numero}`,
        usuarioId
      ]
    );
  }

  for (const pago of calculo.pagos) {
    await conn.query(
      `INSERT INTO pagos_compra
        (compra_id, fecha, monto, metodo, referencia, notas, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        compraId,
        pago.fecha,
        pago.monto,
        pago.metodo,
        pago.referencia,
        pago.notas,
        usuarioId
      ]
    );
  }

  return {
    numero: definicion.numero,
    compraId,
    creada: true,
    total: calculo.total,
    lineas: detalles.length,
    pagos: calculo.pagos.length
  };
}

async function crearOrdenesSeed(conn, usuarioId) {
  console.log('\n5. Creando órdenes de compra de prueba...');

  for (const definicion of ORDENES_SEED) {
    const [existentes] = await conn.query(
      'SELECT id FROM ordenes_compra WHERE numero = ? LIMIT 1',
      [definicion.numero]
    );
    if (existentes.length) {
      console.log(`  = Orden ${definicion.numero} ya existe`);
      continue;
    }

    const [proveedores] = await conn.query(
      'SELECT id FROM proveedores WHERE nit = ? LIMIT 1',
      [definicion.proveedor_nit]
    );
    if (!proveedores.length) {
      throw new Error(`Proveedor no encontrado para la orden: ${definicion.proveedor_nit}`);
    }

    const [result] = await conn.query(
      `INSERT INTO ordenes_compra
        (numero, proveedor_id, fecha, fecha_esperada, estado, notas,
         subtotal_estimado, iva_estimado, total_estimado, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
      [
        definicion.numero,
        proveedores[0].id,
        definicion.fecha,
        definicion.fecha_esperada,
        definicion.estado,
        definicion.notas,
        usuarioId
      ]
    );

    for (const linea of definicion.detalles) {
      const detalles = await resolverDetallesCompra(conn, { detalles: [linea] });
      await conn.query(
        `INSERT INTO detalle_orden_compra
          (orden_id, producto_id, cantidad_solicitada, cantidad_recibida, costo_estimado)
         VALUES (?, ?, ?, 0, ?)`,
        [result.insertId, detalles[0].producto_id, linea.cantidad, linea.costo_unitario]
      );
    }

    const [orden] = await conn.query(
      'SELECT numero, subtotal_estimado, iva_estimado, total_estimado FROM ordenes_compra WHERE id = ?',
      [result.insertId]
    );
    console.log(
      `  + Orden ${orden[0].numero} (${definicion.estado}, ` +
      `Q${Number(orden[0].total_estimado).toFixed(2)})`
    );
  }
}

async function actualizarSecuencias(conn) {
  await conn.query(
    `INSERT INTO secuencias (nombre, anio, valor)
     SELECT 'compras', CAST(SUBSTRING(numero, 3, 4) AS UNSIGNED),
            MAX(CAST(SUBSTRING(numero, 8) AS UNSIGNED))
     FROM compras
     WHERE numero REGEXP '^C-[0-9]{4}-[0-9]+$'
     GROUP BY CAST(SUBSTRING(numero, 3, 4) AS UNSIGNED)
     ON DUPLICATE KEY UPDATE valor = GREATEST(secuencias.valor, VALUES(valor))`
  );

  await conn.query(
    `INSERT INTO secuencias (nombre, anio, valor)
     SELECT 'ordenes_compra', CAST(SUBSTRING(numero, 4, 4) AS UNSIGNED),
            MAX(CAST(SUBSTRING(numero, 9) AS UNSIGNED))
     FROM ordenes_compra
     WHERE numero REGEXP '^OC-[0-9]{4}-[0-9]+$'
     GROUP BY CAST(SUBSTRING(numero, 4, 4) AS UNSIGNED)
     ON DUPLICATE KEY UPDATE valor = GREATEST(secuencias.valor, VALUES(valor))`
  );
}

async function runSeedCompras() {
  const connection = await pool.getConnection();
  try {
    console.log('=== SEED MÓDULO COMPRAS ===');

    const [usuarios] = await connection.query(
      "SELECT id FROM usuarios WHERE username = 'admin' LIMIT 1"
    );
    if (!usuarios.length) {
      throw new Error("No existe el usuario 'admin'. Ejecute primero: npm run seed");
    }
    const usuarioId = usuarios[0].id;

    await connection.query('SET @usuario_id = ?', [usuarioId]);
    await connection.query('SET @sgifep_reset = 0');
    await connection.beginTransaction();

    await insertarProveedores(connection);
    await insertarProductos(connection);
    await asociarProductosProveedor(connection);

    console.log('\n4. Creando compras de prueba...');
    for (const definicion of COMPRAS_SEED) {
      const resultado = await crearCompraSeed(connection, definicion, usuarioId);
      if (resultado.omitida) {
        console.log(`  = Compra ${resultado.numero} ya existe`);
      } else {
        console.log(
          `  + Compra ${resultado.numero} ` +
          `(Q${resultado.total.toFixed(2)}, ${resultado.lineas} líneas, ${resultado.pagos} pagos)`
        );
      }
    }

    await crearOrdenesSeed(connection, usuarioId);
    await actualizarSecuencias(connection);

    await connection.commit();
    console.log('\n=== SEED COMPRAS COMPLETADO ===');
  } catch (error) {
    await connection.rollback();
    console.error('Error en seed-compras:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    connection.release();
    try {
      await pool.pool.end();
    } catch (error) {
      // Ignorar errores al cerrar el pool.
    }
  }
}

runSeedCompras();
