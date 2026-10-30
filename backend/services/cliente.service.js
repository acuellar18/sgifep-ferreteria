const { HttpError } = require('../utils/http-error');
const clienteRepository = require('../repositories/cliente.repository');
const clienteDto = require('../dtos/cliente.dto');

function esConsumidorFinal(cliente) {
  return String(cliente?.nit || '').toUpperCase() === 'CF';
}

class ClienteService {
  async listar(filtros = {}) {
    const { rows, total, page, pageSize } = await clienteRepository.listar({
      q: typeof filtros.q === 'string' ? filtros.q.trim() : '',
      estado: filtros.estado,
      page: filtros.page,
      pageSize: filtros.pageSize,
      sortBy: filtros.sortBy,
      sortDir: filtros.sortDir
    });
    return { data: clienteDto.serializarLista(rows), total, page, pageSize };
  }

  async resumen() {
    return await clienteRepository.resumen();
  }

  async detalle(id) {
    const fila = await clienteRepository.buscarPorId(id);
    if (!fila) throw new HttpError(404, 'Cliente no encontrado');
    const facturas = await clienteRepository.listarFacturasCliente(id);
    return {
      ...clienteDto.serializar(fila),
      facturas: facturas.map((factura) => ({
        id: Number(factura.id),
        numero: factura.numero,
        fecha: factura.fecha,
        total: Number(factura.total || 0),
        saldo: Number(factura.saldo || 0),
        estado: factura.estado,
        estado_pago: factura.estado_pago
      }))
    };
  }

  async crear(datos) {
    const dto = clienteDto.validarCrear(datos);
    if (await clienteRepository.buscarPorNit(dto.nit)) {
      throw new HttpError(409, 'Ya existe un cliente con ese NIT');
    }
    return await clienteRepository.crear(dto);
  }

  async actualizar(id, datos) {
    const existe = await clienteRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Cliente no encontrado');
    if (esConsumidorFinal(existe)) {
      throw new HttpError(409, 'El cliente Consumidor Final no se puede editar');
    }

    const dto = clienteDto.validarActualizar(datos, existe);
    if (await clienteRepository.buscarPorNit(dto.nit, id)) {
      throw new HttpError(409, 'Ya existe un cliente con ese NIT');
    }

    await clienteRepository.actualizar(id, dto);
  }

  async cambiarEstado(id, datos = {}) {
    const existe = await clienteRepository.buscarPorId(id);
    if (!existe) throw new HttpError(404, 'Cliente no encontrado');
    if (esConsumidorFinal(existe)) {
      throw new HttpError(409, 'El cliente Consumidor Final no se puede inactivar');
    }

    let estado = datos.estado;
    if (estado === undefined && datos.activo !== undefined) {
      estado = datos.activo ? 'activo' : 'inactivo';
    }
    estado = typeof estado === 'string' ? estado.trim().toLowerCase() : '';

    if (!clienteDto.ESTADOS.includes(estado)) {
      throw new HttpError(400, 'El estado del cliente debe ser activo o inactivo');
    }

    await clienteRepository.cambiarEstado(id, estado);
    return estado === 'activo' ? 'Cliente activado' : 'Cliente inactivado';
  }
}

module.exports = new ClienteService();
