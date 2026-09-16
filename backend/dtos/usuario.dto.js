const { HttpError } = require('../utils/http-error');

// DTOs de USUARIO: validación de entrada y serialización de salida.
// Nunca se expone password_hash; los roles se devuelven como arreglo de
// objetos { id, nombre }.

// '1::administrador|2::ventas' -> [{ id: 1, nombre: 'administrador' }, ...]
function parseRoles(cadena) {
  if (!cadena) return [];
  return cadena
    .split('|')
    .filter(Boolean)
    .map((parte) => {
      const [id, ...nombre] = parte.split('::');
      return { id: Number(id), nombre: nombre.join('::') };
    });
}

function validarRolesEntrada(roles) {
  if (roles === undefined || roles === null) return [];
  const ids = [...new Set(roles.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  return ids;
}

// Validación común para crear y actualizar.
function baseValidacion(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const apellido = typeof datos.apellido === 'string' ? datos.apellido.trim() : '';
  const codigo = typeof datos.codigo === 'string' ? datos.codigo.trim() : '';
  const username = typeof datos.username === 'string' ? datos.username.trim() : '';

  if (!nombre) throw new HttpError(400, 'El nombre es requerido');
  if (!username) throw new HttpError(400, 'El nombre de usuario es requerido');
  if (!codigo) throw new HttpError(400, 'El código es requerido');

  let departamento_id = null;
  if (datos.departamento_id !== undefined && datos.departamento_id !== null && datos.departamento_id !== '') {
    departamento_id = Number(datos.departamento_id);
    if (!Number.isInteger(departamento_id)) {
      throw new HttpError(400, 'El departamento indicado no es válido');
    }
  }

  return {
    nombre,
    apellido: apellido || null,
    codigo,
    username,
    departamento_id,
    roles: validarRolesEntrada(datos.roles),
    activo: datos.activo === undefined ? true : Boolean(datos.activo)
  };
}

function validarCrear(datos = {}) {
  const dto = baseValidacion(datos);
  const password = typeof datos.password === 'string' ? datos.password : '';
  if (!password) {
    throw new HttpError(400, 'La contraseña es requerida');
  }
  return { ...dto, password };
}

function validarActualizar(datos = {}) {
  const dto = baseValidacion(datos);
  const password = typeof datos.password === 'string' ? datos.password : '';
  return { ...dto, password: password || null };
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    apellido: fila.apellido,
    username: fila.username,
    departamento_id: fila.departamento_id,
    departamento_nombre: fila.departamento_nombre,
    activo: Boolean(fila.activo),
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    roles: parseRoles(fila.roles)
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

module.exports = {
  parseRoles,
  validarCrear,
  validarActualizar,
  validarRolesEntrada,
  serializar,
  serializarLista
};