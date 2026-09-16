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
  }
});