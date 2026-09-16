// Inicializador idempotente del backend: crea (si faltan) las tablas del módulo
// de Usuarios, agrega las columnas que faltan en una base legacy, siembra
// departamentos/roles por defecto y garantiza un usuario 'admin' ACTIVO con
// contraseña 'admin123' vinculado al rol 'administrador'.
// Uso: npm run seed  (en backend/)

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const DEPARTAMENTOS_DEFECTO = [
  ['Secretaria', 'Secretaría y atención general'],
  ['Catedratico', 'Área docente / catedráticos'],
  ['Ventas', 'Ventas y atención a clientes'],
  ['Bodega', 'Manejo de inventario y bodega'],
  ['Caja', 'Caja y cobros'],
  ['Administracion', 'Administración general']
];

const ROLES_DEFECTO = [
  { nombre: 'administrador', descripcion: 'Acceso total al sistema', acceso_total: 1 },
  { nombre: 'ventas', descripcion: 'Módulo de ventas', acceso_total: 0 },
  { nombre: 'bodega', descripcion: 'Módulo de inventario', acceso_total: 0 },
  { nombre: 'caja', descripcion: 'Caja y cobros', acceso_total: 0 },
  { nombre: 'compras', descripcion: 'Compras y abastecimiento', acceso_total: 0 },
  { nombre: 'reparto', descripcion: 'Despacho de productos', acceso_total: 0 }
];

async function columnasDe(tabla) {
  const [filas] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tabla]
  );
  return new Set(filas.map((f) => f.COLUMN_NAME));
}

async function asegurarTablas() {
  console.log('Asegurando esquema (tablas y columnas)...');

  // Tabla de departamentos (necesaria antes que usuarios por la FK).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS departamentos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE,
      descripcion VARCHAR(255) DEFAULT NULL,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // Tabla de roles (con superadmin en el CREATE para instalaciones nuevas).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL UNIQUE,
      descripcion VARCHAR(255) DEFAULT NULL,
      acceso_total TINYINT(1) NOT NULL DEFAULT 0,
      superadmin TINYINT(1) NOT NULL DEFAULT 0,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // Tabla de usuarios (solo si no existe; columnas legacy se agregan abajo).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) DEFAULT NULL,
      codigo VARCHAR(30) DEFAULT NULL UNIQUE,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      rol VARCHAR(20) DEFAULT 'admin',
      departamento_id INT DEFAULT NULL,
      activo TINYINT(1) DEFAULT 1,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_usuarios_departamento FOREIGN KEY (departamento_id)
        REFERENCES departamentos(id) ON DELETE SET NULL
    )`);

  // Tabla puente de roles múltiples.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuario_roles (
      usuario_id INT NOT NULL,
      rol_id INT NOT NULL,
      PRIMARY KEY (usuario_id, rol_id),
      CONSTRAINT fk_ur_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT fk_ur_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
    )`);

  // Migración defensiva: si 'roles' ya existía SIN superadmin (pre-003), se agrega.
  const colsRoles = await columnasDe('roles');
  if (!colsRoles.has('superadmin')) {
    await pool.query(
      `ALTER TABLE roles ADD COLUMN superadmin TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el rol permite acceso total (superadmin)'`
    );
  }

  // Columnas legacy de 'usuarios' que el módulo requiere.
  const colsUsuarios = await columnasDe('usuarios');
  const agregar = (existe, sql) => {
    if (existe) return Promise.resolve();
    console.log(`  + agregando columna faltante: ${sql.split(' ')[2] || ''}`);
    return pool.query(sql);
  };
  await agregar(colsUsuarios.has('password_hash'),
    'ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER username');
  await agregar(colsUsuarios.has('apellido'),
    'ALTER TABLE usuarios ADD COLUMN apellido VARCHAR(100) DEFAULT NULL AFTER nombre');
  await agregar(colsUsuarios.has('codigo'),
    'ALTER TABLE usuarios ADD COLUMN codigo VARCHAR(30) DEFAULT NULL UNIQUE AFTER apellido');
  await agregar(colsUsuarios.has('departamento_id'),
    `ALTER TABLE usuarios ADD COLUMN departamento_id INT DEFAULT NULL,
     ADD CONSTRAINT fk_usuarios_departamento FOREIGN KEY (departamento_id)
       REFERENCES departamentos(id) ON DELETE SET NULL`);
  await agregar(colsUsuarios.has('actualizado_en'),
    'ALTER TABLE usuarios ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await agregar(colsUsuarios.has('rol'),
    "ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) DEFAULT 'admin' AFTER password_hash");
  await agregar(colsUsuarios.has('activo'),
    'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) DEFAULT 1 AFTER rol');
}

async function sembrarCatalogos() {
  console.log('Sembrando departamentos y roles por defecto...');

  for (const [nombre, descripcion] of DEPARTAMENTOS_DEFECTO) {
    await pool.query(
      `INSERT INTO departamentos (nombre, descripcion, activo)
       SELECT ?, ?, 1 FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM departamentos WHERE nombre = ?)`,
      [nombre, descripcion, nombre]
    );
  }

  for (const rol of ROLES_DEFECTO) {
    await pool.query(
      `INSERT INTO roles (nombre, descripcion, acceso_total, superadmin, activo)
       SELECT ?, ?, ?, ?, 1 FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM roles WHERE nombre = ?)`,
      [rol.nombre, rol.descripcion, rol.acceso_total, rol.acceso_total, rol.nombre]
    );
  }

  // Mantiene superadmin sincronizado con acceso_total.
  await pool.query('UPDATE roles SET superadmin = acceso_total WHERE superadmin <> acceso_total');
}

async function garantizarAdmin() {
  console.log('Garantizando usuario admin (admin / admin123)...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  // Inserta o actualiza: deja SIEMPRE activo y con la contraseña por defecto.
  await pool.query(
    `INSERT INTO usuarios (nombre, apellido, codigo, username, password_hash, rol, activo)
     VALUES ('Administrador', '', 'ADM-001', 'admin', ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE password_hash = ?, activo = 1`,
    [passwordHash, passwordHash]
  );

  // Vincular al rol administrador (primera vez o si cambió el rol por id).
  const [roles] = await pool.query(
    `SELECT id FROM roles WHERE nombre = 'administrador' ORDER BY id ASC LIMIT 1`
  );
  const rolAdminId = roles[0]?.id || 1;
  await pool.query(
    `INSERT INTO usuario_roles (usuario_id, rol_id)
     SELECT u.id, ? FROM usuarios u WHERE u.username = 'admin'
     ON DUPLICATE KEY UPDATE rol_id = ?`,
    [rolAdminId, rolAdminId]
  );
}

async function runSeed() {
  try {
    console.log('Conectado a MySQL correctamente.');
    await asegurarTablas();
    await sembrarCatalogos();
    await garantizarAdmin();

    const [filas] = await pool.query(
      `SELECT u.id, u.username, u.activo, r.nombre AS rol
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
       WHERE u.username = 'admin'`
    );
    const admin = filas[0] || {};

    console.log('====================================');
    console.log('¡Base de datos inicializada exitosamente!');
    console.log('Usuario: admin');
    console.log('Contraseña: admin123');
    console.log(`Estado: ${admin.activo ? 'ACTIVO' : 'inactivo'}`);
    console.log(`Rol: ${admin.rol || 'administrador'}`);
    console.log('====================================');

    process.exit(0);
  } catch (error) {
    console.error('Error al ejecutar el seed:', error.message);
    process.exit(1);
  }
}

runSeed();