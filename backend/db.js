const path = require('path');
const mysql = require('mysql2/promise');

// Carga las variables de entorno desde backend/.env (independiente del cwd)
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Pool centralizado de conexiones: lo reutilizan server.js, seed.js y las rutas.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;