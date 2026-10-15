const { HttpError } = require('../utils/http-error');
const pool = require('../db');
const proveedorRepository = require('../repositories/proveedor.repository');
const proveedorDto = require('../dtos/proveedor.dto');

class ProveedorService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await proveedorRepository.listar({
      q: filtros.q,
      estado: filtros.estado,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: proveedorDto.serializarLista(rows), total, page, pageSize };
  }

  async listarResumen(filtros = {}) {
    const rows = await proveedorRepository.listarResumen({
      q: filtros.q,
      estado: filtros.estado
    });
    return { data: proveedorDto.serializarResumenLista(rows) };
  }

  async detalle(id) {
    const fila = await proveedorRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Proveedor no encontrado');
    return proveedorDto.serializar(fila);
  }

  async ficha(id) {
    const ficha = await proveedorRepository.obtenerFicha(id);
    if (!ficha) throw new HttpError(404, 'Proveedor no encontrado');
    return proveedorDto.serializarFicha(ficha, ficha.compras, ficha.productos);
  }

  async crear(datos) {
    const dto = proveedorDto.validarCrear(datos);

    if (await proveedorRepository.buscarPorNIT(dto.nit)) {
      throw new HttpError(409, 'Ya existe un proveedor con ese NIT');
    }

    const id = await proveedorRepository.crear(dto);
    return id;
  }

  async actualizar(id, datos) {
    const dto = proveedorDto.validarActualizar(datos);

    const existe = await proveedorRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Proveedor no encontrado');

    if (dto.nit && await proveedorRepository.buscarPorNIT(dto.nit, id)) {
      throw new HttpError(409, 'Ya existe un proveedor con ese NIT');
    }

    await proveedorRepository.actualizar(id, dto);
  }

  async cambiarEstado(id, activo) {
    const valor = Number(activo);
    if (valor !== 0 && valor !== 1) {
      throw new HttpError(400, 'El campo activo debe ser 0 o 1');
    }
    const affected = await proveedorRepository.cambiarEstado(id, valor);
    if (affected === 0) throw new HttpError(404, 'Proveedor no encontrado');
    return valor ? 'Proveedor activado' : 'Proveedor inactivado';
  }

  async eliminar(id) {
    try {
      await proveedorRepository.eliminar(id);
    } catch (err) {
      if (err.code === 'HAS_COMPRAS') {
        throw new HttpError(400, err.message);
      }
      throw err;
    }
  }
}

module.exports = new ProveedorService();