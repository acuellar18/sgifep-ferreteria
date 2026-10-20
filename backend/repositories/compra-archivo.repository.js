const pool = require('../db');

class CompraArchivoRepository {
  async listar(compraId) {
    const [rows] = await pool.query(
      `SELECT ca.id, ca.compra_id, ca.nombre_original, ca.nombre_guardado, ca.mime,
              ca.tamano, ca.creado_en, ca.usuario_id, u.nombre AS usuario_nombre
       FROM compra_archivos ca
       LEFT JOIN usuarios u ON u.id = ca.usuario_id
       WHERE ca.compra_id = ?
       ORDER BY ca.creado_en DESC, ca.id DESC`,
      [compraId]
    );
    return rows;
  }

  async buscar(compraId, archivoId) {
    const [rows] = await pool.query(
      `SELECT id, compra_id, nombre_original, nombre_guardado, mime, tamano, usuario_id
       FROM compra_archivos
       WHERE id = ? AND compra_id = ?`,
      [archivoId, compraId]
    );
    return rows[0] || null;
  }

  async crear(datos) {
    const { compra_id, nombre_original, nombre_guardado, mime, tamano, usuario_id } = datos;
    const [result] = await pool.query(
      `INSERT INTO compra_archivos
         (compra_id, nombre_original, nombre_guardado, mime, tamano, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [compra_id, nombre_original, nombre_guardado, mime, tamano, usuario_id]
    );
    return result.insertId;
  }

  async eliminar(compraId, archivoId) {
    const [result] = await pool.query(
      'DELETE FROM compra_archivos WHERE id = ? AND compra_id = ?',
      [archivoId, compraId]
    );
    return result.affectedRows;
  }
}

module.exports = new CompraArchivoRepository();
