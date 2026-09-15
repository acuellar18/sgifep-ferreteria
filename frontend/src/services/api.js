import axios from 'axios';

// Cliente HTTP centralizado. Todas las páginas usan esta instancia,
// nunca se repite la configuración ni el manejo de errores.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000
});

// El backend responde siempre { success, data?, mensaje? }.
// Aquí se devuelve directamente el objeto y se convierten los errores
// en un Error con mensaje en español, listo para mostrar al usuario.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
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