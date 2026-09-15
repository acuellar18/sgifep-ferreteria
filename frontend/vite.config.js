import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: '/usuarios/' -> el build de producción se copia a backend/public/usuarios
//       y se sirve bajo esa URL desde Express.
export default defineConfig({
  plugins: [react()],
  base: '/usuarios/',
  server: {
    // En desarrollo, el frontend habla con el backend Express real sin CORS.
    proxy: {
      '/api': 'http://127.0.0.1:3000'
    }
  }
});