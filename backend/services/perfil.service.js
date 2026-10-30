const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const { HttpError } = require('../utils/http-error');
const usuarioRepository = require('../repositories/usuario.repository');
const perfilDto = require('../dtos/perfil.dto');
const { DIRECTORIO, nombreArchivo } = require('../middlewares/upload-perfil.middleware');

const FORMATOS = new Set(['jpeg', 'png', 'webp']);

function rutaSegura(nombreGuardado) {
  return path.join(DIRECTORIO, path.basename(nombreGuardado));
}

async function borrarSilencioso(nombre) {
  if (!nombre) return;
  await fs.unlink(rutaSegura(nombre)).catch(() => {});
}

class PerfilService {
  async detalle(usuarioId) {
    const fila = await usuarioRepository.buscarPorId(usuarioId);
    if (!fila) throw new HttpError(404, 'Usuario no encontrado');
    return perfilDto.serializar(fila);
  }

  async actualizar(usuarioId, datos) {
    const dto = perfilDto.validarActualizar(datos);
    const afectadas = await usuarioRepository.actualizarPerfil(usuarioId, dto);
    if (!afectadas) throw new HttpError(404, 'Usuario no encontrado');
    return this.detalle(usuarioId);
  }

  async guardarFoto(usuarioId, archivo) {
    if (!archivo || !archivo.buffer) throw new HttpError(400, 'Debe seleccionar una foto');

    const perfil = await usuarioRepository.buscarPorId(usuarioId);
    if (!perfil) throw new HttpError(404, 'Usuario no encontrado');

    let metadata;
    try {
      metadata = await sharp(archivo.buffer, {
        failOn: 'error',
        limitInputPixels: 25000000
      }).metadata();
    } catch {
      throw new HttpError(400, 'El contenido de la foto no es válido');
    }

    if (!FORMATOS.has(metadata.format)) {
      throw new HttpError(400, 'La foto debe ser JPG, PNG o WebP');
    }

    const nombre = nombreArchivo(usuarioId);
    const ruta = rutaSegura(nombre);

    try {
      await fs.mkdir(DIRECTORIO, { recursive: true });
      await sharp(archivo.buffer, { failOn: 'error', limitInputPixels: 25000000 })
        .rotate()
        .resize(512, 512, { fit: 'cover', position: 'centre' })
        .webp({ quality: 86 })
        .toFile(ruta);

      await usuarioRepository.actualizarFotoPerfil(usuarioId, {
        foto: nombre,
        foto_mime: 'image/webp'
      });
    } catch (err) {
      await borrarSilencioso(nombre);
      if (err instanceof HttpError) throw err;
      throw new HttpError(400, 'No se pudo procesar la foto');
    }

    await borrarSilencioso(perfil.foto);
    return this.detalle(usuarioId);
  }

  async obtenerFoto(usuarioId) {
    const fila = await usuarioRepository.obtenerFotoPerfil(usuarioId);
    if (!fila?.foto) throw new HttpError(404, 'El usuario no tiene foto de perfil');

    const ruta = rutaSegura(fila.foto);
    try {
      await fs.access(ruta);
    } catch {
      throw new HttpError(404, 'La foto de perfil ya no está disponible');
    }

    return { ruta, mime: fila.foto_mime || 'image/webp' };
  }

  async eliminarFoto(usuarioId) {
    const fila = await usuarioRepository.obtenerFotoPerfil(usuarioId);
    if (!fila?.foto) throw new HttpError(404, 'El usuario no tiene foto de perfil');

    await usuarioRepository.actualizarFotoPerfil(usuarioId, { foto: null, foto_mime: null });
    await borrarSilencioso(fila.foto);
    return this.detalle(usuarioId);
  }
}

module.exports = new PerfilService();
