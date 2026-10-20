class SecuenciaRepository {
  async obtenerNumero(conn, { nombre, prefijo, anio, longitud = 6 }) {
    if (!conn) {
      throw new Error('La secuencia requiere una conexión transaccional');
    }
    const destino = conn;

    const anioNumero = Number(anio);
    if (!Number.isInteger(anioNumero) || anioNumero < 2000 || anioNumero > 9999) {
      throw new Error('Año inválido para la secuencia');
    }

    await destino.query(
      `INSERT INTO secuencias (nombre, anio, valor)
       VALUES (?, ?, LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE valor = LAST_INSERT_ID(valor + 1)`,
      [nombre, anioNumero]
    );

    const [rows] = await destino.query('SELECT LAST_INSERT_ID() AS valor');
    const valor = Number(rows[0]?.valor);
    if (!Number.isSafeInteger(valor) || valor < 1) {
      throw new Error('No se pudo obtener el correlativo de la secuencia');
    }

    return `${prefijo}-${anioNumero}-${String(valor).padStart(longitud, '0')}`;
  }
}

module.exports = new SecuenciaRepository();
