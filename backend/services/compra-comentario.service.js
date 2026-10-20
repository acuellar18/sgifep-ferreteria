const { HttpError } = require('../utils/http-error');
const compraRepository = require('../repositories/compra.repository');
const comentarioRepository = require('../repositories/compra-comentario.repository');

function serializar(fila) {
  return {
    id: fila.id,
    compra_id: fila.compra_id,
    comentario: fila.comentario,
    usuario_id: fila.usuario_id,
    usuario_nombre: fila.usuario_nombre,
    creado_en: fila.creado_en
  };
}

class CompraComentarioService {
  async listar(compraId) {
    const compra = await compraRepository.buscarPorId(compraId);
    if (!compra) throw new HttpError(404, 'Compra no encontrada');
    const filas = await comentarioRepository.listar(compraId);
    return filas.map(serializar);
  }

  async crear(compraId, usuarioId, texto) {
    const compra = await compraRepository.buscarPorId(compraId);
    if (!compra) throw new HttpError(404, 'Compra no encontrada');

    const comentario = typeof texto === 'string' ? texto.trim() : '';
    if (!comentario) throw new HttpError(400, 'El comentario es requerido');
    if (comentario.length > 2000) {
      throw new HttpError(400, 'El comentario no puede exceder 2000 caracteres');
    }

    const id = await comentarioRepository.crear(compraId, usuarioId, comentario);
    const filas = await comentarioRepository.listar(compraId);
    return serializar(filas.find((fila) => Number(fila.id) === Number(id)));
  }
}

module.exports = new CompraComentarioService();
