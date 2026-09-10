require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function runSeed() {
    try {
        // Conexión usando las variables de entorno de Railway
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Conectado a MySQL correctamente.');

        // Crear la tabla de usuarios si no existe
        await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(20) DEFAULT 'admin',
                activo TINYINT(1) DEFAULT 1
            )
        `);

        // Encriptar contraseña por defecto (admin123)
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Insertar o actualizar el usuario admin
        await connection.query(`
            INSERT INTO usuarios (nombre, username, password_hash, rol, activo)
            VALUES ('Administrador', 'admin', ?, 'admin', 1)
            ON DUPLICATE KEY UPDATE password_hash = ?
        `, [passwordHash, passwordHash]);

        console.log('====================================');
        console.log('¡Base de datos y usuario creados exitosamente!');
        console.log('Usuario: admin');
        console.log('Contraseña: admin123');
        console.log('====================================');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error al ejecutar el seed:', error.message);
        process.exit(1);
    }
}

runSeed();