const pool = require('../db');

class CompraComentarioRepository {
  async listar(compraId) {
    const [rows] = await pool.query(
      `SELECT cc.id, cc.compra_id, cc.comentario, cc.creado_en,
              cc.usuario_id, u.nombre AS usuario_nombre
       FROM compra_comentarios cc
       LEFT JOIN usuarios u ON u.id = cc.usuario_id
       WHERE cc.compra_id = ?
       ORDER BY cc.creado_en ASC, cc.id ASC`,
      [compraId]
    );
    return rows;
  }

  async crear(compraId, usuarioId, comentario) {
    const [result] = await pool.query(
      `INSERT INTO compra_comentarios (compra_id, usuario_id, comentario)
       VALUES (?, ?, ?)`,
      [compraId, usuarioId, comentario]
    );
    return result.insertId;
  }
}

module.exports = new CompraComentarioRepository();
