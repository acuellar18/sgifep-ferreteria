require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir los archivos web desde la carpeta public (al mismo nivel que server.js)
const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));

// Pool de conexiones a MySQL en Railway
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Ruta principal: Carga index.html desde backend/public
app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// Endpoint de autenticación para login.html
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Usuario y contraseña son requeridos' 
        });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, username, password_hash, rol, activo FROM usuarios WHERE username = ? LIMIT 1',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                mensaje: 'Usuario o contraseña incorrectos' 
            });
        }

        const usuario = rows[0];

        if (!usuario.activo) {
            return res.status(403).json({ 
                success: false, 
                mensaje: 'Este usuario está deshabilitado' 
            });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ 
                success: false, 
                mensaje: 'Usuario o contraseña incorrectos' 
            });
        }

        res.json({
            success: true,
            usuario: {
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (err) {
        console.error('Error en /api/login:', err.message);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error interno del servidor' 
        });
    }
});

// Endpoint para restablecer la contraseña
app.post('/api/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'El usuario y la nueva contraseña son requeridos' 
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await pool.query(
            'UPDATE usuarios SET password_hash = ? WHERE username = ?', 
            [hashedPassword, username]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                mensaje: 'El usuario ingresado no existe' 
            });
        }

        res.json({ 
            success: true, 
            mensaje: 'Contraseña actualizada correctamente' 
        });

    } catch (err) {
        console.error('Error en /api/reset-password:', err.message);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error interno del servidor' 
        });
    }
});

// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor SGIFEP corriendo en el puerto ${PORT}`);
});