const { HttpError } = require('../utils/http-error');
const { validarPassword } = require('../utils/password');

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
  validarPassword(password, { username: dto.username, nombre: dto.nombre });
  return { ...dto, password };
}

function validarActualizar(datos = {}) {
  const dto = baseValidacion(datos);
  const password = typeof datos.password === 'string' ? datos.password : '';
  if (password) {
    validarPassword(password, { username: dto.username, nombre: dto.nombre });
  }
  return { ...dto, password: password || null };
}

// Registro público: crea la cuenta INACTIVA y sin roles; un administrador
// debe activarla (y asignar roles) antes del primer ingreso.
function validarRegistroPublico(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const apellido = typeof datos.apellido === 'string' ? datos.apellido.trim() : '';
  let username = typeof datos.username === 'string' ? datos.username.trim() : '';
  const email = typeof datos.email === 'string' ? datos.email.trim().toLowerCase() : '';
  const password = typeof datos.password === 'string' ? datos.password : '';

  if (!nombre || nombre.length < 2) throw new HttpError(400, 'El nombre es requerido (mínimo 2 letras)');
  if (nombre.length > 80) throw new HttpError(400, 'El nombre es demasiado largo');
  if (apellido.length > 80) throw new HttpError(400, 'El apellido es demasiado largo');

  if (!username) throw new HttpError(400, 'El nombre de usuario es requerido');
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
    throw new HttpError(400, 'El usuario debe tener 3-30 caracteres y solo puede usar letras, números, punto, guion o guion bajo (sin espacios)');
  }
  username = username.toLowerCase();

  if (!email) throw new HttpError(400, 'El correo es requerido');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) {
    throw new HttpError(400, 'El correo no es válido');
  }

  if (!password) throw new HttpError(400, 'La contraseña es requerida');
  validarPassword(password, { username, nombre });

  return { nombre, apellido: apellido || null, username, email, password };
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    apellido: fila.apellido,
    username: fila.username,
    correo: fila.correo || null,
    tiene_foto: Boolean(fila.foto),
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

function serializarPerfil(fila) {
  const base = serializar(fila);
  if (!base) return null;
  return {
    ...base,
    correo: fila.correo || null,
    tiene_foto: Boolean(fila.foto)
  };
}

module.exports = {
  parseRoles,
  validarCrear,
  validarActualizar,
  validarRegistroPublico,
  validarRolesEntrada,
  serializar,
  serializarLista,
  serializarPerfil
};