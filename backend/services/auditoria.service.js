const auditoriaRepository = require('../repositories/auditoria.repository');

function serializar(fila) {
  if (!fila) return null;
  let datos = null;
  if (fila.datos) {
    try {
      datos = JSON.parse(fila.datos);
    } catch {
      datos = fila.datos;
    }
  }
  return {
    id: Number(fila.id),
    usuario_id: fila.usuario_id ? Number(fila.usuario_id) : null,
    username: fila.username || null,
    usuario_nombre: fila.usuario_nombre || null,
    accion: fila.accion,
    entidad: fila.entidad || null,
    entidad_id: fila.entidad_id || null,
    descripcion: fila.descripcion || null,
    datos,
    ip: fila.ip || null,
    user_agent: fila.user_agent || null,
    creado_en: fila.creado_en
  };
}

class AuditoriaService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await auditoriaRepository.listar({
      q: typeof filtros.q === 'string' ? filtros.q.trim() : '',
      accion: typeof filtros.accion === 'string' ? filtros.accion.trim() : '',
      usuario: filtros.usuario,
      desde: filtros.desde,
      hasta: filtros.hasta,
      page: filtros.page,
      pageSize: filtros.pageSize
    });
    return { data: rows.map(serializar), total, page, pageSize };
  }

  async acciones() {
    return (await auditoriaRepository.acciones()).map((fila) => ({
      accion: fila.accion,
      total: Number(fila.total || 0)
    }));
  }

  async resumen() {
    return await auditoriaRepository.resumen();
  }
}

module.exports = new AuditoriaService();
