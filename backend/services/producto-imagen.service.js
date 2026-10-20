const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const { HttpError } = require('../utils/http-error');
const productoRepository = require('../repositories/producto.repository');
const { DIRECTORIO, nombreArchivo } = require('../middlewares/upload-producto.middleware');

const FORMATOS = new Set(['jpeg', 'png', 'webp']);

function rutaSegura(nombreGuardado) {
  return path.join(DIRECTORIO, path.basename(nombreGuardado));
}

async function borrarSilencioso(nombre) {
  if (!nombre) return;
  await fs.unlink(rutaSegura(nombre)).catch(() => {});
}

class ProductoImagenService {
  async guardar(id, archivo) {
    if (!archivo || !archivo.buffer) throw new HttpError(400, 'Debe seleccionar una imagen');

    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');

    let metadata;
    try {
      metadata = await sharp(archivo.buffer, {
        failOn: 'error',
        limitInputPixels: 25000000
      }).metadata();
    } catch {
      throw new HttpError(400, 'El contenido de la imagen no es válido');
    }

    if (!FORMATOS.has(metadata.format)) {
      throw new HttpError(400, 'La imagen debe ser JPG, PNG o WebP');
    }

    const nombres = nombreArchivo(id);
    const rutaImagen = rutaSegura(nombres.imagen);
    const rutaMiniatura = rutaSegura(nombres.imagen_miniatura);

    try {
      await fs.mkdir(DIRECTORIO, { recursive: true });
      await Promise.all([
        sharp(archivo.buffer, { failOn: 'error', limitInputPixels: 25000000 })
          .rotate()
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(rutaImagen),
        sharp(archivo.buffer, { failOn: 'error', limitInputPixels: 25000000 })
          .rotate()
          .resize(160, 160, { fit: 'cover', position: 'centre' })
          .webp({ quality: 78 })
          .toFile(rutaMiniatura)
      ]);

      await productoRepository.actualizarImagen(id, {
        imagen: nombres.imagen,
        imagen_miniatura: nombres.imagen_miniatura,
        imagen_mime: 'image/webp'
      });
    } catch (err) {
      await Promise.all([borrarSilencioso(nombres.imagen), borrarSilencioso(nombres.imagen_miniatura)]);
      if (err instanceof HttpError) throw err;
      throw new HttpError(400, 'No se pudo procesar la imagen');
    }

    await this.eliminarArchivos(producto);

    return { tiene_imagen: true, imagen_mime: 'image/webp' };
  }

  async obtener(id, { miniatura = false } = {}) {
    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');

    const nombre = miniatura
      ? producto.imagen_miniatura || producto.imagen
      : producto.imagen;
    if (!nombre) throw new HttpError(404, 'El producto no tiene imagen');

    const ruta = rutaSegura(nombre);
    try {
      await fs.access(ruta);
    } catch {
      throw new HttpError(404, 'La imagen ya no está disponible');
    }

    return { ruta, mime: producto.imagen_mime || 'image/webp' };
  }

  async eliminar(id) {
    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');
    if (!producto.imagen && !producto.imagen_miniatura) {
      throw new HttpError(404, 'El producto no tiene imagen');
    }

    await productoRepository.actualizarImagen(id, {
      imagen: null,
      imagen_miniatura: null,
      imagen_mime: null
    });
    await this.eliminarArchivos(producto);
  }

  async eliminarArchivos(producto) {
    if (!producto) return;
    await Promise.all([
      borrarSilencioso(producto.imagen),
      borrarSilencioso(producto.imagen_miniatura)
    ]);
  }
}

module.exports = new ProductoImagenService();
