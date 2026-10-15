// Seed de datos de prueba para módulo Compras
// Uso: node seed-compras.js (en backend/)

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

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
  // Cemento y Concreto
  { codigo: 'CEM-001', nombre: 'Cemento Gris 42.5kg', descripcion: 'Cemento Portland tipo IP', categoria: 'Cemento y Concreto', unidad: 'UNI', stock_min: 50, costo: 75.50, precio: 95.00 },
  { codigo: 'CEM-002', nombre: 'Cemento Blanco 40kg', descripcion: 'Cemento blanco estructural', categoria: 'Cemento y Concreto', unidad: 'UNI', stock_min: 20, costo: 95.00, precio: 120.00 },
  { codigo: 'CON-001', nombre: 'Concreto Premezclado 2500psi m3', descripcion: 'Concreto listo para vaciar', categoria: 'Cemento y Concreto', unidad: 'MTS', stock_min: 5, costo: 850.00, precio: 1100.00 },

  // Tubería y Conexiones
  { codigo: 'TUB-001', nombre: 'Tubería PVC 1/2" x 6m', descripcion: 'Tubería PVC sanitaria', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 100, costo: 18.50, precio: 28.00 },
  { codigo: 'TUB-002', nombre: 'Tubería PVC 3/4" x 6m', descripcion: 'Tubería PVC sanitaria', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 80, costo: 25.00, precio: 38.00 },
  { codigo: 'TUB-003', nombre: 'Tubería PVC 1" x 6m', descripcion: 'Tubería PVC sanitaria', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 60, costo: 38.00, precio: 55.00 },
  { codigo: 'CON-002', nombre: 'Codo PVC 1/2" 90°', descripcion: 'Conexión PVC codo 90 grados', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 200, costo: 3.50, precio: 6.00 },
  { codigo: 'CON-003', nombre: 'Tee PVC 1/2"', descripcion: 'Conexión PVC Tee', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 150, costo: 4.20, precio: 7.00 },
  { codigo: 'CON-004', nombre: 'Unión PVC 1/2"', descripcion: 'Conexión PVC unión', categoria: 'Tubería y Conexiones', unidad: 'UNI', stock_min: 100, costo: 5.80, precio: 9.00 },

  // Pinturas y Recubrimientos
  { codigo: 'PIN-001', nombre: 'Pintura Vinílica Blanca 19L', descripcion: 'Pintura interior/exterior lavable', categoria: 'Pinturas y Recubrimientos', unidad: 'CJA', stock_min: 30, costo: 285.00, precio: 380.00 },
  { codigo: 'PIN-002', nombre: 'Pintura Esmalte Sintético 1L', descripcion: 'Esmalte para metal y madera', categoria: 'Pinturas y Recubrimientos', unidad: 'UNI', stock_min: 50, costo: 45.00, precio: 65.00 },
  { codigo: 'PIN-003', nombre: 'Impermeabilizante Acrílico 19L', descripcion: 'Para techos y muros', categoria: 'Pinturas y Recubrimientos', unidad: 'CJA', stock_min: 20, costo: 320.00, precio: 420.00 },
  { codigo: 'PIN-004', nombre: 'Sellador Silicona 300ml', descripcion: 'Sellador multipropósito', categoria: 'Pinturas y Recubrimientos', unidad: 'UNI', stock_min: 100, costo: 22.00, precio: 35.00 },

  // Herramientas Manuales
  { codigo: 'HER-001', nombre: 'Martillo Carpintero 16oz', descripcion: 'Martillo con mango de fibra', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 30, costo: 55.00, precio: 85.00 },
  { codigo: 'HER-002', nombre: 'Juego Llaves Combinadas 8-19mm', descripcion: '12 piezas, acero cromo vanadio', categoria: 'Herramientas Manuales', unidad: 'CJA', stock_min: 15, costo: 180.00, precio: 280.00 },
  { codigo: 'HER-003', nombre: 'Alicate Universal 8"', descripcion: 'Alicate de corte y presión', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 40, costo: 48.00, precio: 75.00 },
  { codigo: 'HER-004', nombre: 'Destornillador Phillips #2 x 6"', descripcion: 'Punta magnética, mango ergonómico', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 60, costo: 18.00, precio: 30.00 },
  { codigo: 'HER-005', nombre: 'Cinta Métrica 5m', descripcion: 'Cinta métrica con freno', categoria: 'Herramientas Manuales', unidad: 'UNI', stock_min: 50, costo: 25.00, precio: 42.00 },

  // Herramientas Eléctricas
  { codigo: 'HEL-001', nombre: 'Taladro Percutor 1/2" 650W', descripcion: 'Taladro industrial 2 velocidades', categoria: 'Herramientas Eléctricas', unidad: 'UNI', stock_min: 10, costo: 380.00, precio: 550.00 },
  { codigo: 'HEL-002', nombre: 'Amoladora Angular 4.5"', descripcion: 'Amoladora 750W con disco', categoria: 'Herramientas Eléctricas', unidad: 'UNI', stock_min: 15, costo: 290.00, precio: 420.00 },
  { codigo: 'HEL-003', nombre: 'Sierra Circular 7.25"', descripcion: 'Sierra 1400W con guía láser', categoria: 'Herramientas Eléctricas', unidad: 'UNI', stock_min: 8, costo: 450.00, precio: 650.00 },

  // Material Eléctrico
  { codigo: 'ELE-001', nombre: 'Cable THHN 12 AWG Negro 100m', descripcion: 'Cable cobre aislado THHN', categoria: 'Material Eléctrico', unidad: 'ROL', stock_min: 20, costo: 420.00, precio: 580.00 },
  { codigo: 'ELE-002', nombre: 'Cable THHN 14 AWG Blanco 100m', descripcion: 'Cable cobre aislado THHN', categoria: 'Material Eléctrico', unidad: 'ROL', stock_min: 20, costo: 280.00, precio: 380.00 },
  { codigo: 'ELE-003', nombre: 'Interruptor Sencillo 15A', descripcion: 'Interruptor residencial blanco', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 100, costo: 8.50, precio: 15.00 },
  { codigo: 'ELE-004', nombre: 'Tomacorriente Duplex 15A', descripcion: 'Contacto doble polarizado', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 100, costo: 12.00, precio: 20.00 },
  { codigo: 'ELE-005', nombre: 'Breaker Termomagnético 20A 2P', descripcion: 'Breaker DIN rail 2 polos', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 30, costo: 85.00, precio: 130.00 },
  { codigo: 'ELE-006', nombre: 'Tablero Carga 12 Circuitos', descripcion: 'Tablero principal residencial', categoria: 'Material Eléctrico', unidad: 'UNI', stock_min: 10, costo: 320.00, precio: 480.00 }
];

async function runSeedCompras() {
  try {
    console.log('=== SEED MÓDULO COMPRAS ===');
    console.log('Conectado a MySQL correctamente.');

    // 1. Insertar proveedores
    console.log('\n1. Insertando proveedores...');
    for (const p of PROVEEDORES) {
      await pool.query(
        `INSERT INTO proveedores (nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, 1 FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nit = ?)`,
        [p.nombre, p.nit, p.contacto_nombre, p.telefono, p.correo, p.direccion, p.dias_credito, p.notas, p.nit]
      );
      console.log(`  + ${p.nombre}`);
    }

    // 2. Obtener IDs de categorías
    const [categorias] = await pool.query('SELECT id, nombre FROM categorias');
    const catMap = new Map(categorias.map(c => [c.nombre, c.id]));

    // 3. Obtener IDs de proveedores
    const [proveedores] = await pool.query('SELECT id, nombre FROM proveedores');
    const provMap = new Map(proveedores.map(p => [p.nombre, p.id]));

    // 4. Insertar productos
    console.log('\n2. Insertando productos...');
    for (const p of PRODUCTOS) {
      const catId = catMap.get(p.categoria);
      if (!catId) {
        console.log(`  ! Categoría no encontrada: ${p.categoria} para ${p.nombre}`);
        continue;
      }
      const [result] = await pool.query(
        `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, costo_ultimo, costo_promedio, precio_venta, activo, stock_actual)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0 FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM productos WHERE codigo = ?)`,
        [p.codigo, p.nombre, p.descripcion, catId, p.unidad, p.stock_min, p.costo, p.costo, p.precio, p.codigo]
      );
      if (result.affectedRows > 0) {
        console.log(`  + ${p.nombre} (${p.codigo})`);
      }
    }

    // 5. Asociar productos con proveedores (producto_proveedor)
    console.log('\n3. Asociando productos con proveedores...');
    const asociaciones = [
      // Cementos Progreso -> Cemento y Concreto
      { proveedor: 'Cementos Progreso S.A.', productos: ['CEM-001', 'CEM-002', 'CON-001'] },
      // Tuberías del Sur -> Tubería y Conexiones
      { proveedor: 'Tuberías y Conexiones del Sur', productos: ['TUB-001', 'TUB-002', 'TUB-003', 'CON-002', 'CON-003', 'CON-004'] },
      // Pinturas El Color -> Pinturas
      { proveedor: 'Pinturas El Color S.A.', productos: ['PIN-001', 'PIN-002', 'PIN-003', 'PIN-004'] },
      // Herramientas Industriales -> Herramientas
      { proveedor: 'Herramientas Industriales S.A.', productos: ['HER-001', 'HER-002', 'HER-003', 'HER-004', 'HER-005', 'HEL-001', 'HEL-002', 'HEL-003'] },
      // Electricidad del Norte -> Material Eléctrico
      { proveedor: 'Electricidad y Cables del Norte', productos: ['ELE-001', 'ELE-002', 'ELE-003', 'ELE-004', 'ELE-005', 'ELE-006'] }
    ];

    for (const a of asociaciones) {
      const provId = provMap.get(a.proveedor);
      if (!provId) continue;
      for (const prodCod of a.productos) {
        const [prod] = await pool.query('SELECT id FROM productos WHERE codigo = ?', [prodCod]);
        if (prod.length > 0) {
          const p = prod[0];
          const [pp] = await pool.query('SELECT 1 FROM producto_proveedor WHERE producto_id = ? AND proveedor_id = ?', [p.id, provId]);
          if (pp.length === 0) {
            const prodInfo = PRODUCTOS.find(x => x.codigo === prodCod);
            await pool.query(
              `INSERT INTO producto_proveedor (producto_id, proveedor_id, costo_ultimo, es_preferido) VALUES (?, ?, ?, 1)`,
              [p.id, provId, prodInfo?.costo || 0]
            );
            console.log(`  + ${prodCod} -> ${a.proveedor}`);
          }
        }
      }
    }

    // 6. Crear algunas compras de prueba
    console.log('\n4. Creando compras de prueba...');
    const [usuario] = await pool.query("SELECT id FROM usuarios WHERE username = 'admin' LIMIT 1");
    const usuarioId = usuario[0]?.id || 1;

    // Obtener algunos productos para compras
    const [prods] = await pool.query('SELECT id, codigo, nombre, costo_ultimo FROM productos WHERE codigo IN (?,?,?,?,?,?) LIMIT 6', ['CEM-001', 'TUB-001', 'PIN-001', 'HER-001', 'ELE-001', 'ELE-003']);
    const [provs] = await pool.query('SELECT id, nombre, dias_credito FROM proveedores LIMIT 3');

    if (prods.length >= 3 && provs.length >= 2) {
      const prov1 = provs[0]; // Cementos Progreso
      const prov2 = provs[1]; // Tuberías del Sur
      const prov3 = provs[2]; // Pinturas El Color

      // Compra 1: Contado - Cementos Progreso
      const fecha1 = '2025-01-15';
      const numero1 = 'C-2025-000001';
      const subtotal1 = (50 * 75.50) + (20 * 45.00);
      const iva1 = Math.round(subtotal1 * 0.12 * 100) / 100;
      const total1 = Math.round((subtotal1 + iva1) * 100) / 100;

      await pool.query(
        `INSERT INTO compras (numero, proveedor_id, fecha, numero_factura, condicion, fecha_vencimiento, subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado, usuario_id, notas)
         SELECT ?, ?, ?, 'FAC-001', 'contado', ?, ?, ?, ?, ?, ?, 'pagada', 'recibida', ?, 'Compra contado cemento'
         FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM compras WHERE numero = ?)`,
        [numero1, prov1.id, fecha1, fecha1, subtotal1, iva1, total1, total1, 0, usuarioId, numero1]
      );

      const [compra1] = await pool.query('SELECT id FROM compras WHERE numero = ?', [numero1]);
      if (compra1.length > 0) {
        const c1 = compra1[0].id;
        await pool.query(`INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?,?,?,?,?)`, [c1, prods[0].id, 50, 75.50, 50*75.50]);
        await pool.query(`INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?,?,?,?,?)`, [c1, prods[3].id, 20, 45.00, 20*45.00]);
        await pool.query(`INSERT INTO pagos_proveedor (compra_id, fecha, monto, metodo, referencia, notas, usuario_id) VALUES (?,?,?,?,?,?,?)`, [c1, fecha1, total1, 'efectivo', 'CONT-001', 'Pago contado', usuarioId]);
        // Actualizar stock
        await pool.query(`UPDATE productos SET stock_actual = stock_actual + 50, costo_ultimo = 75.50, costo_promedio = 75.50 WHERE id = ?`, [prods[0].id]);
        await pool.query(`UPDATE productos SET stock_actual = stock_actual + 20, costo_ultimo = 45.00, costo_promedio = 45.00 WHERE id = ?`, [prods[3].id]);
        console.log(`  + Compra ${numero1} (Contado)`);
      }

      // Compra 2: Crédito - Tuberías del Sur
      const fecha2 = '2025-01-20';
      const venc2 = new Date(fecha2);
      venc2.setDate(venc2.getDate() + prov2.dias_credito);
      const venc2Str = venc2.toISOString().split('T')[0];
      const numero2 = 'C-2025-000002';
      const subtotal2 = (100 * 18.50) + (50 * 25.00) + (30 * 38.00);
      const iva2 = Math.round(subtotal2 * 0.12 * 100) / 100;
      const total2 = Math.round((subtotal2 + iva2) * 100) / 100;

      await pool.query(
        `INSERT INTO compras (numero, proveedor_id, fecha, numero_factura, condicion, fecha_vencimiento, subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado, usuario_id, notas)
         SELECT ?, ?, ?, 'FAC-002', 'credito', ?, ?, ?, ?, 0, ?, 'pendiente', 'recibida', ?, 'Compra crédito tuberías'
         FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM compras WHERE numero = ?)`,
        [numero2, prov2.id, fecha2, venc2Str, subtotal2, iva2, total2, total2, usuarioId, numero2]
      );

      const [compra2] = await pool.query('SELECT id FROM compras WHERE numero = ?', [numero2]);
      if (compra2.length > 0) {
        const c2 = compra2[0].id;
        await pool.query(`INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?,?,?,?,?)`, [c2, prods[1].id, 100, 18.50, 100*18.50]);
        // TUB-002 y TUB-003 necesitan IDs
        const [tub2] = await pool.query('SELECT id FROM productos WHERE codigo = ?', ['TUB-002']);
        const [tub3] = await pool.query('SELECT id FROM productos WHERE codigo = ?', ['TUB-003']);
        if (tub2.length) await pool.query(`INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?,?,?,?,?)`, [c2, tub2[0].id, 50, 25.00, 50*25.00]);
        if (tub3.length) await pool.query(`INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?,?,?,?,?)`, [c2, tub3[0].id, 30, 38.00, 30*38.00]);
        await pool.query(`UPDATE productos SET stock_actual = stock_actual + 100, costo_ultimo = 18.50, costo_promedio = 18.50 WHERE id = ?`, [prods[1].id]);
        if (tub2.length) await pool.query(`UPDATE productos SET stock_actual = stock_actual + 50, costo_ultimo = 25.00, costo_promedio = 25.00 WHERE id = ?`, [tub2[0].id]);
        if (tub3.length) await pool.query(`UPDATE productos SET stock_actual = stock_actual + 30, costo_ultimo = 38.00, costo_promedio = 38.00 WHERE id = ?`, [tub3[0].id]);
        console.log(`  + Compra ${numero2} (Crédito - pendiente)`);
      }

      // Compra 3: Crédito parcial pagada - Pinturas El Color
      const fecha3 = '2025-02-01';
      const venc3 = new Date(fecha3);
      venc3.setDate(venc3.getDate() + prov3.dias_credito);
      const venc3Str = venc3.toISOString().split('T')[0];
      const numero3 = 'C-2025-000003';
      const subtotal3 = (15 * 285.00) + (25 * 45.00);
      const iva3 = Math.round(subtotal3 * 0.12 * 100) / 100;
      const total3 = Math.round((subtotal3 + iva3) * 100) / 100;
      const pagado3 = Math.round(total3 * 0.4 * 100) / 100; // 40% pagado
      const saldo3 = Math.round((total3 - pagado3) * 100) / 100;

      await pool.query(
        `INSERT INTO compras (numero, proveedor_id, fecha, numero_factura, condicion, fecha_vencimiento, subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado, usuario_id, notas)
         SELECT ?, ?, ?, 'FAC-003', 'credito', ?, ?, ?, ?, ?, ?, 'parcial', 'recibida', ?, 'Compra crédito pinturas - pago parcial'
         FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM compras WHERE numero = ?)`,
        [numero3, prov3.id, fecha3, venc3Str, subtotal3, iva3, total3, pagado3, saldo3, usuarioId, numero3]
      );

      const [compra3] = await pool.query('SELECT id FROM compras WHERE numero = ?', [numero3]);
      if (compra3.length > 0) {
        const c3 = compra3[0].id;
        await pool.query(`INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES (?,?,?,?,?)`, [c3, prods[2].id, 15, 285.00, 15*285.00]);
        await pool.query(`INSERT INTO pagos_proveedor (compra_id, fecha, monto, metodo, referencia, notas, usuario_id) VALUES (?,?,?,?,?,?,?)`, [c3, '2025-02-10', pagado3, 'transferencia', 'TRF-001', 'Abono 40%', usuarioId]);
        await pool.query(`UPDATE productos SET stock_actual = stock_actual + 15, costo_ultimo = 285.00, costo_promedio = 285.00 WHERE id = ?`, [prods[2].id]);
        console.log(`  + Compra ${numero3} (Crédito - parcial)`);
      }
    }

    // 7. Crear órdenes de compra de prueba
    console.log('\n5. Creando órdenes de compra de prueba...');
    if (prods.length >= 2 && provs.length >= 1) {
      const prov = provs[0];
      const [oc1] = await pool.query('SELECT MAX(CAST(SUBSTRING(numero, 5) AS UNSIGNED)) AS max_num FROM ordenes_compra WHERE numero LIKE ?', ['OC-2025-%']);
      const maxNum = oc1[0]?.max_num || 0;
      const numeroOC1 = `OC-2025-${String(maxNum + 1).padStart(6, '0')}`;

      const subtotalOC = (30 * 75.50) + (20 * 18.50);
      const ivaOC = Math.round(subtotalOC * 0.12 * 100) / 100;
      const totalOC = Math.round((subtotalOC + ivaOC) * 100) / 100;

      await pool.query(
        `INSERT INTO ordenes_compra (numero, proveedor_id, fecha, fecha_esperada, estado, notas, subtotal_estimado, iva_estimado, total_estimado, usuario_id)
         SELECT ?, ?, '2025-02-15', '2025-02-28', 'enviada', 'Orden cemento y tuberías', ?, ?, ?, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM ordenes_compra WHERE numero = ?)`,
        [numeroOC1, prov.id, subtotalOC, ivaOC, totalOC, usuarioId, numeroOC1]
      );

      const [orden] = await pool.query('SELECT id FROM ordenes_compra WHERE numero = ?', [numeroOC1]);
      if (orden.length > 0) {
        const oid = orden[0].id;
        await pool.query(`INSERT INTO detalle_orden_compra (orden_id, producto_id, cantidad_solicitada, cantidad_recibida, costo_estimado) VALUES (?,?,?,0,?)`, [oid, prods[0].id, 30, 75.50]);
        await pool.query(`INSERT INTO detalle_orden_compra (orden_id, producto_id, cantidad_solicitada, cantidad_recibida, costo_estimado) VALUES (?,?,?,0,?)`, [oid, prods[1].id, 20, 18.50]);
        console.log(`  + Orden ${numeroOC1} (Enviada)`);
      }

      // Orden 2: Borrador para generar desde stock bajo
      const [oc2] = await pool.query('SELECT MAX(CAST(SUBSTRING(numero, 5) AS UNSIGNED)) AS max_num FROM ordenes_compra WHERE numero LIKE ?', ['OC-2025-%']);
      const maxNum2 = oc2[0]?.max_num || 0;
      const numeroOC2 = `OC-2025-${String(maxNum2 + 1).padStart(6, '0')}`;

      await pool.query(
        `INSERT INTO ordenes_compra (numero, proveedor_id, fecha, fecha_esperada, estado, notas, subtotal_estimado, iva_estimado, total_estimado, usuario_id)
         SELECT ?, ?, '2025-02-20', '2025-03-05', 'borrador', 'Orden pendiente por confirmar', 0, 0, 0, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM ordenes_compra WHERE numero = ?)`,
        [numeroOC2, provs[1].id, usuarioId, numeroOC2]
      );
      console.log(`  + Orden ${numeroOC2} (Borrador)`);
    }

    console.log('\n=== SEED COMPRAS COMPLETADO ===');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed-compras:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runSeedCompras();