import axios from 'axios';

const CLAVE_SESION = 'session';

// Leer la sesión guardada por login.html (localStorage['session']).
// Contiene { nombre, username, rol, roles, superadmin, token }.
export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

// Cliente HTTP centralizado. Todas las páginas usan esta instancia:
// inyecta automáticamente el token JWT y normaliza los errores.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000
});

// Seguridad mediante JWT: adjunta el token a cada petición.
api.interceptors.request.use((config) => {
  const sesion = leerSesion();
  if (sesion?.token) {
    config.headers.Authorization = `Bearer ${sesion.token}`;
  }
  return config;
});

// El backend responde siempre { success, data?, mensaje? }.
// En 401 (token inválido/expirado o sesión sin token) se limpia la sesión y
// se redirige al login estático para volver a autenticarse.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(CLAVE_SESION);
      const ruta = window.location.pathname;
      if (!ruta.endsWith('/login.html') && !ruta.includes('/login')) {
        window.location.href = '/login.html';
      }
    }
    const mensaje =
      error.response?.data?.mensaje ||
      (error.code === 'ECONNABORTED'
        ? 'La solicitud tardó demasiado, intente de nuevo'
        : error.response
          ? 'Ocurrió un error al comunicarse con el servidor'
          : 'No se pudo conectar con el servidor');
    return Promise.reject(new Error(mensaje));
  }
);

export default api;