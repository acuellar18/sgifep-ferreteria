const { HttpError } = require('../utils/http-error');
const configuracionRepository = require('../repositories/configuracion-empresa.repository');
const configuracionDto = require('../dtos/configuracion-empresa.dto');

class ConfiguracionEmpresaService {
  async obtener() {
    const fila = await configuracionRepository.obtener();
    return configuracionDto.serializar(fila);
  }

  async actualizar(datos) {
    const dto = configuracionDto.validar(datos);
    await configuracionRepository.actualizar(dto);
    const configuracion = await this.obtener();
    if (!configuracion) throw new HttpError(404, 'Configuración de empresa no encontrada');
    return configuracion;
  }
}

module.exports = new ConfiguracionEmpresaService();
