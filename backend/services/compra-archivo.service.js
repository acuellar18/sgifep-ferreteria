const path = require('path');
const fs = require('fs/promises');
const { HttpError } = require('../utils/http-error');
const compraRepository = require('../repositories/compra.repository');
const archivoRepository = require('../repositories/compra-archivo.repository');
const { DIRECTORIO } = require('../middlewares/upload-compra.middleware');

function serializar(fila) {
  return {
    id: fila.id,
    compra_id: fila.compra_id,
    nombre_original: fila.nombre_original,
    mime: fila.mime,
    tamano: Number(fila.tamano || 0),
    usuario_id: fila.usuario_id,
    usuario_nombre: fila.usuario_nombre,
    creado_en: fila.creado_en
  };
}

function rutaSegura(nombreGuardado) {
  return path.join(DIRECTORIO, path.basename(nombreGuardado));
}

async function validarContenido(archivo) {
  const ruta = rutaSegura(archivo.filename);
  const manejador = await fs.open(ruta, 'r');
  const cabecera = Buffer.alloc(8);
  try {
    await manejador.read(cabecera, 0, 8, 0);
  } finally {
    await manejador.close();
  }

  const esPDF = cabecera.subarray(0, 5).toString() === '%PDF-';
  const esJPEG = cabecera[0] === 0xff && cabecera[1] === 0xd8 && cabecera[2] === 0xff;
  const esPNG = cabecera.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  if (
    (archivo.mimetype === 'application/pdf' && !esPDF) ||
    (archivo.mimetype === 'image/jpeg' && !esJPEG) ||
    (archivo.mimetype === 'image/png' && !esPNG)
  ) {
    await fs.unlink(ruta).catch(() => {});
    throw new HttpError(400, 'El contenido del archivo no corresponde al formato permitido');
  }
}

class CompraArchivoService {
  async listar(compraId) {
    const compra = await compraRepository.buscarPorId(compraId);
    if (!compra) throw new HttpError(404, 'Compra no encontrada');
    const filas = await archivoRepository.listar(compraId);
    return filas.map(serializar);
  }

  async crear(compraId, usuarioId, archivo) {
    if (!archivo) throw new HttpError(400, 'Debe seleccionar un archivo');
    const compra = await compraRepository.buscarPorId(compraId);
    if (!compra) {
      await fs.unlink(rutaSegura(archivo.filename)).catch(() => {});
      throw new HttpError(404, 'Compra no encontrada');
    }

    try {
      await validarContenido(archivo);
      const id = await archivoRepository.crear({
        compra_id: compraId,
        nombre_original: archivo.originalname,
        nombre_guardado: archivo.filename,
        mime: archivo.mimetype,
        tamano: archivo.size,
        usuario_id: usuarioId
      });
      return { id };
    } catch (err) {
      await fs.unlink(rutaSegura(archivo.filename)).catch(() => {});
      throw err;
    }
  }

  async obtenerParaDescarga(compraId, archivoId) {
    const archivo = await archivoRepository.buscar(compraId, archivoId);
    if (!archivo) throw new HttpError(404, 'Archivo no encontrado');
    const ruta = rutaSegura(archivo.nombre_guardado);
    try {
      await fs.access(ruta);
    } catch {
      throw new HttpError(404, 'El archivo ya no está disponible');
    }
    return { archivo, ruta };
  }

  async eliminar(compraId, archivoId) {
    const archivo = await archivoRepository.buscar(compraId, archivoId);
    if (!archivo) throw new HttpError(404, 'Archivo no encontrado');
    await archivoRepository.eliminar(compraId, archivoId);
    await fs.unlink(rutaSegura(archivo.nombre_guardado)).catch(() => {});
  }
}

module.exports = new CompraArchivoService();
