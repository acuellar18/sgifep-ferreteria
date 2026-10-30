const pool = require('../db');

class AuditoriaRepository {
  async listar({ q, accion, usuario, desde, hasta, page = 1, pageSize = 25 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(a.descripcion LIKE ? OR a.entidad LIKE ? OR a.username LIKE ? OR a.entidad_id LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (accion) {
      where.push('a.accion = ?');
      params.push(accion);
    }
    if (usuario) {
      where.push('a.usuario_id = ?');
      params.push(Number(usuario));
    }
    if (desde) {
      where.push('DATE(a.creado_en) >= ?');
      params.push(desde);
    }
    if (hasta) {
      where.push('DATE(a.creado_en) <= ?');
      params.push(hasta);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [conteo] = await pool.query(
      `SELECT COUNT(*) AS total FROM auditoria_eventos a ${whereSql}`,
      params
    );
    const total = Number(conteo[0]?.total || 0);
    const limite = Math.max(1, Math.min(Number(pageSize) || 25, 100));
    const pagina = Math.max(1, Number(page) || 1);
    const offset = (pagina - 1) * limite;

    const [rows] = await pool.query(
      `SELECT a.id, a.usuario_id, a.username, a.accion, a.entidad, a.entidad_id,
              a.descripcion, a.datos, a.ip, a.user_agent, a.creado_en,
              u.nombre AS usuario_nombre
       FROM auditoria_eventos a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ${whereSql}
       ORDER BY a.creado_en DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return { rows, total, page: pagina, pageSize: limite };
  }

  async acciones() {
    const [rows] = await pool.query(
      `SELECT accion, COUNT(*) AS total
       FROM auditoria_eventos
       GROUP BY accion
       ORDER BY accion ASC`
    );
    return rows;
  }

  async resumen() {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN DATE(creado_en) = CURDATE() THEN 1 ELSE 0 END) AS hoy,
         COUNT(DISTINCT usuario_id) AS usuarios
       FROM auditoria_eventos`
    );
    const fila = rows[0] || {};
    return {
      total: Number(fila.total || 0),
      hoy: Number(fila.hoy || 0),
      usuarios: Number(fila.usuarios || 0)
    };
  }
}

module.exports = new AuditoriaRepository();
