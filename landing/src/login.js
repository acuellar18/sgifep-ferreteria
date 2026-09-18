// Configura los enlaces "Acceso al sistema" (elementos con data-login-url):
// en desarrollo apuntan al servidor del Sistema (5174); en producción al
// mismo origen (/login.html, servido por Express).
const URL_LOGIN =
  import.meta.env.VITE_SISTEMA_LOGIN_URL ||
  (import.meta.env.DEV ? 'http://localhost:5174/usuarios/login.html' : '/login.html');

document.querySelectorAll('a[data-login-url]').forEach((enlace) => {
  enlace.setAttribute('href', URL_LOGIN);
});