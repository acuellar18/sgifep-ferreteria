require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Cambiá estos datos por los del usuario que querés crear
const NUEVO_USUARIO = {
    nombre: 'Administrador',
    username: 'admin',
    password: 'admin123', // se encripta abajo, nunca se guarda así
    rol: 'administrador'
};

async function crearUsuario() {
    const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

    const hash = await bcrypt.hash(NUEVO_USUARIO.password, 10);

    await conexion.query(
        'INSERT INTO usuarios (nombre, username, password_hash, rol) VALUES (?, ?, ?, ?)',
        [NUEVO_USUARIO.nombre, NUEVO_USUARIO.username, hash, NUEVO_USUARIO.rol]
    );

    console.log(`Usuario "${NUEVO_USUARIO.username}" creado con rol "${NUEVO_USUARIO.rol}".`);
    console.log(`Podés iniciar sesión con usuario: ${NUEVO_USUARIO.username} / contraseña: ${NUEVO_USUARIO.password}`);

    await conexion.end();
}

crearUsuario().catch(err => {
    console.error('Error al crear el usuario:', err.message);
});
