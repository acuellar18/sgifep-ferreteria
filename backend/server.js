require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// ---------- Contenido estático (landing + sistema) ----------

// La landing page se compila con Vite en ../landing/dist y se sirve en la raíz.
const landingDistPath = path.join(__dirname, '..', 'landing', 'dist');
app.use(express.static(landingDistPath));

// Servir los archivos del Sistema (login, modulos, img, usuarios) desde public
const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));

// Ruta principal: sirve la landing compilada, o un aviso si aún no existe
app.get('/', (req, res) => {
  const landingIndex = path.join(landingDistPath, 'index.html');
  if (fs.existsSync(landingIndex)) {
    res.sendFile(landingIndex);
  } else {
    res.status(200).send('Landing no compilada. Ejecuta: cd landing && npm run build');
  }
});

// ---------- API REST (arquitectura MVC: rutas -> controladores -> servicios) ----------

app.use('/api', require('./routes/auth.routes')); // /api/login, /api/reset-password
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/departamentos', require('./routes/departamentos.routes'));

// ---------- SPA / catch-all ----------

// Catch-all del módulo React: sirve index.html para rutas internas como
// /usuarios/reporte sin que el servidor devuelva 404 al recargar.
app.get('/usuarios/*', (req, res) => {
  res.sendFile(path.join(staticPath, 'usuarios', 'index.html'));
});

// ---------- Manejo de errores centralizado ----------

const { rutaNoEncontrada, manejarErrores } = require('./middlewares/error.middleware');
app.use(rutaNoEncontrada);
app.use(manejarErrores);

// ---------- Inicio del servidor ----------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor SGIFEP corriendo en el puerto ${PORT}`);
});