require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors()); // en producción, restringir a tu dominio real
app.use(express.json());

// Pool de conexiones a MySQL (mejor que abrir una conexión por request)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, mensaje: 'Usuario y contraseña son requeridos' });
    }

    try {
        // Consulta preparada: nunca concatenar el input directamente en el SQL
        const [rows] = await pool.query(
            'SELECT id, nombre, username, password_hash, rol, activo FROM usuarios WHERE username = ? LIMIT 1',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }

        const usuario = rows[0];

        if (!usuario.activo) {
            return res.status(403).json({ success: false, mensaje: 'Este usuario está deshabilitado' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }

        // Coincide con lo que espera login.html: data.usuario.nombre y data.usuario.rol
        res.json({
            success: true,
            usuario: {
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (err) {
        console.error('Error en /api/login:', err.message);
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor SGIFEP corriendo en http://127.0.0.1:${PORT}`);
});
