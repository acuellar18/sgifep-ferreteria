// Reinicia por completo los datos demo del módulo Compras y ejecuta el seed.
// Uso: npm run reiniciar-compras (en backend/)
//
// Conserva usuarios, roles, departamentos, usuario_roles y categorías.
// Elimina proveedores, productos, compras, órdenes, pagos, movimientos,
// relaciones producto-proveedor y la bitácora de auditoría.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');

const TABLAS_DATOS = [
  'pagos_compra',
  'detalle_compra',
  'detalle_orden_compra',
  'compras',
  'ordenes_compra',
  'movimientos_inventario',
  'producto_proveedor',
  'productos',
  'proveedores',
  'bitacora_auditoria',
  'secuencias'
];

const TABLAS_AUTOINCREMENT = [
  'pagos_compra',
  'detalle_compra',
  'detalle_orden_compra',
  'compras',
  'ordenes_compra',
  'movimientos_inventario',
  'producto_proveedor',
  'productos',
  'proveedores',
  'bitacora_auditoria'
];

async function verificarEsquema(connection) {
  const [filas] = await connection.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN (?)`,
    [TABLAS_DATOS]
  );
  const existentes = new Set(filas.map((f) => f.TABLE_NAME));
  const faltantes = TABLAS_DATOS.filter((tabla) => !existentes.has(tabla));

  if (faltantes.length) {
    throw new Error(
      `Faltan tablas del módulo Compras: ${faltantes.join(', ')}. ` +
      'Ejecute primero: npm run migrate'
    );
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4_unicode_ci',
    multipleStatements: true
  });

  try {
    console.log('=== REINICIO DE DATOS DEMO: COMPRAS ===');
    await verificarEsquema(connection);

    await connection.query('SET @sgifep_reset = 1');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    try {
      await connection.beginTransaction();
      for (const tabla of TABLAS_DATOS) {
        await connection.query(`DELETE FROM \`${tabla}\``);
        console.log(`  - ${tabla}`);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      await connection.query('SET @sgifep_reset = 0');
    }

    for (const tabla of TABLAS_AUTOINCREMENT) {
      await connection.query(`ALTER TABLE \`${tabla}\` AUTO_INCREMENT = 1`);
    }

    console.log('\nDatos demo eliminados. Ejecutando seed...\n');
  } finally {
    await connection.end();
  }

  execFileSync(process.execPath, [path.join(__dirname, '..', 'seed-compras.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
}

main().catch((error) => {
  console.error('Error al reiniciar Compras:', error.message);
  process.exit(1);
});
