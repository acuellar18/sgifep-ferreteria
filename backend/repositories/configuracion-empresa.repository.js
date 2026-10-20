const pool = require('../db');

class ConfiguracionEmpresaRepository {
  async obtener() {
    const [rows] = await pool.query(
      `SELECT id, nombre, nit, direccion, telefono, correo, logo_url, actualizado_en
       FROM configuracion_empresa
       WHERE id = 1`
    );
    return rows[0] || null;
  }

  async actualizar(datos) {
    const { nombre, nit, direccion, telefono, correo, logo_url } = datos;
    const [result] = await pool.query(
      `UPDATE configuracion_empresa
       SET nombre = ?, nit = ?, direccion = ?, telefono = ?, correo = ?, logo_url = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [nombre, nit, direccion, telefono, correo, logo_url]
    );
    return result.affectedRows;
  }
}

module.exports = new ConfiguracionEmpresaRepository();
