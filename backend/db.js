const path = require('path');
const mysql = require('mysql2/promise');

// Patrón Singleton: una única instancia de la BD (pool de conexiones) es
// compartida por todo el backend (repositorios, servicios y rutas).
class Database {
  static instancia = null;

  constructor() {
    // Carga las variables de entorno desde backend/.env (independiente del cwd).
    require('dotenv').config({ path: path.join(__dirname, '.env') });

    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'Z'
    });
  }

  static obtenerInstancia() {
    if (!Database.instancia) {
      Database.instancia = new Database();
    }
    return Database.instancia;
  }

  query(sql, params) {
    return this.pool.query(sql, params);
  }

  getConnection() {
    return this.pool.getConnection();
  }
}

module.exports = Database.obtenerInstancia();