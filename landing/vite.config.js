import { defineConfig } from 'vite';

// Landing page: sitio multi-página (MPA) de HTML/CSS estático.
// Utiliza el puerto 5173 y copia incuidas public/img al build.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        contacto: 'contacto.html',
        nosotros: 'nosotros.html',
        ubicacion: 'ubicacion.html'
      }
    }
  },
  server: {
    proxy: {
      // El formulario de contacto envía a /api/contacto (backend Express en 3000).
      '/api': 'http://127.0.0.1:3000'
    }
  }
});