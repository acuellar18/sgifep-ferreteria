import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin: en dev, con base '/usuarios/', Vite sirve public/ bajo /usuarios/*.
// Reescritura mínima para que las rutas absolutas de login/modulos/imágenes
// (/login.html, /modulos.html, /img/*) resuelvan igual que en producción.
// Debe ser un plugin (configureServer no es una opción de `server`).
const reescribirRutasSistema = {
  name: 'reescribir-rutas-sistema',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/login.html' || req.url === '/modulos.html' || req.url.startsWith('/img/')) {
        req.url = '/usuarios' + req.url;
      }
      next();
    });
  }
};

// base: '/usuarios/' -> el build de producción se copia a backend/public/usuarios
//       y se sirve bajo esa URL desde Express.
export default defineConfig({
  plugins: [react(), reescribirRutasSistema],
  base: '/usuarios/',
  server: {
    // Puerto fijo del Sistema (la landing usa el 5173, el backend el 3000).
    port: 5174,
    // En desarrollo, el frontend habla con el backend Express real sin CORS.
    proxy: {
      '/api': 'http://127.0.0.1:3000'
    }
  }
});
