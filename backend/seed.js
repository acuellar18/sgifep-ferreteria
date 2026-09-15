require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function runSeed() {
    try {
        // Conexión usando el pool centralizado de db.js
        console.log('Conectado a MySQL correctamente.');

        // Crear la tabla de usuarios si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) DEFAULT NULL,
                codigo VARCHAR(30) DEFAULT NULL,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(20) DEFAULT 'admin',
                departamento_id INT DEFAULT NULL,
                activo TINYINT(1) DEFAULT 1,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_usuarios_codigo (codigo),
                CONSTRAINT fk_usuarios_departamento FOREIGN KEY (departamento_id)
                    REFERENCES departamentos(id) ON DELETE SET NULL
            )
        `);

        // Encriptar contraseña por defecto (admin123)
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Insertar o actualizar el usuario admin
        await pool.query(`
            INSERT INTO usuarios (nombre, apellido, codigo, username, password_hash, rol, activo)
            VALUES ('Administrador', '', 'ADM-001', 'admin', ?, 'admin', 1)
            ON DUPLICATE KEY UPDATE password_hash = ?
        `, [passwordHash, passwordHash]);

        // Asegurar que el admin quede vinculado al rol "administrador"
        await pool.query(`
            INSERT INTO usuario_roles (usuario_id, rol_id)
            SELECT id, 1 FROM usuarios WHERE username = 'admin'
            ON DUPLICATE KEY UPDATE rol_id = 1
        `);

        console.log('====================================');
        console.log('¡Base de datos y usuario creados exitosamente!');
        console.log('Usuario: admin');
        console.log('Contraseña: admin123');
        console.log('====================================');

        process.exit(0);
    } catch (error) {
        console.error('Error al ejecutar el seed:', error.message);
        process.exit(1);
    }
}

runSeed();