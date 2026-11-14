const path = require('path');
const mysql = require('mysql2/promise');

// Guatemala no usa horario de verano: zona fija por defecto UTC-6.
const ZONA_POR_DEFECTO = '-06:00';

// Patrón Singleton: una única instancia de la BD (pool de conexiones) es
// compartida por todo el backend (repositorios, servicios y rutas).
class Database {
  static instancia = null;

  constructor() {
    // Carga las variables de entorno desde backend/.env (independiente del cwd).
    require('dotenv').config({ path: path.join(__dirname, '.env') });

    this._base = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4_unicode_ci',
      waitForConnections: true,
      connectionLimit: 10
    };

    this._zona = process.env.DB_TIMEZONE || ZONA_POR_DEFECTO;
    this.pool = this._crearPool(this._zona);
    this._iniciando = null;
  }

  _crearPool(zona) {
    // La opción timezone indica a mysql2 en qué zona están guardados los
    // DATETIME del servidor, para convertirlos correctamente a fechas JS
    // (y serializar parámetros Date en la misma zona).
    const pool = mysql.createPool({ ...this._base, timezone: zona });

    // La zona de la sesión MySQL debe coincidir con la del driver. Si el
    // servidor está en UTC y aquí se usa -06:00, los TIMESTAMP se leen con
    // 6 horas de diferencia (el ticket mostraba hora UTC). Forzar la sesión
    // deja ambos lados alineados sin depender de la configuración global.
    if (/^[+-]\d{2}:\d{2}$/.test(zona)) {
      pool.on('connection', (conexion) => {
        conexion.query(`SET time_zone = '${zona}'`, () => {});
      });
    }

    return pool;
  }

  // Detecta el desfase real del servidor MySQL respecto a UTC comparando
  // NOW() (hora de sesión del servidor) con UTC_TIMESTAMP(), como cadenas
  // crudas para evitar cualquier conversión del driver.
  async _detectarZonaHoraria() {
    const conexion = await mysql.createConnection({ ...this._base, dateStrings: true });
    try {
      const [filas] = await conexion.query(
        'SELECT NOW() AS ahora_local, UTC_TIMESTAMP() AS ahora_utc'
      );
      const local = String(filas[0]?.ahora_local || '');
      const utc = String(filas[0]?.ahora_utc || '');
      const msLocal = Date.parse(`${local.replace(' ', 'T')}Z`);
      const msUtc = Date.parse(`${utc.replace(' ', 'T')}Z`);
      if (!Number.isFinite(msLocal) || !Number.isFinite(msUtc)) return null;

      const minutos = Math.round((msLocal - msUtc) / 60000);
      if (Math.abs(minutos) > 14 * 60) return null;

      const signo = minutos < 0 ? '-' : '+';
      const absoluto = Math.abs(minutos);
      const horas = String(Math.floor(absoluto / 60)).padStart(2, '0');
      const minutosTexto = String(absoluto % 60).padStart(2, '0');
      return `${signo}${horas}:${minutosTexto}`;
    } finally {
      await conexion.end();
    }
  }

  // Ajusta el pool con la zona horaria real del servidor MySQL. Debe
  // llamarse antes de empezar a atender peticiones (server.js). Si
  // DB_TIMEZONE está definido en .env se respeta esa configuración manual.
  async iniciar() {
    if (!this._iniciando) {
      this._iniciando = (async () => {
        if (process.env.DB_TIMEZONE) return;
        let zona = null;
        try {
          zona = await this._detectarZonaHoraria();
        } catch (err) {
          console.warn(
            `No se pudo detectar la zona horaria de MySQL (${err.message}); se usa ${this._zona}.`
          );
        }
        if (zona && zona !== this._zona) {
          const poolAnterior = this.pool;
          this._zona = zona;
          this.pool = this._crearPool(zona);
          await poolAnterior.end().catch(() => {});
          console.log(`Zona horaria de MySQL detectada: ${zona}`);
        }
      })();
    }
    await this._iniciando;
    return this.pool;
  }

  query(sql, params) {
    return this.pool.query(sql, params);
  }

  getConnection() {
    return this.pool.getConnection();
  }
}

Database.obtenerInstancia = () => {
  if (!Database.instancia) {
    Database.instancia = new Database();
  }
  return Database.instancia;
};

module.exports = Database.obtenerInstancia();
