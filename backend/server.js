require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middlewares globales
app.use(require('./middlewares/security.middleware'));
app.use(cors());
app.use(express.json());

app.use('/api', (req, res, next) => {
  const enviarJson = res.json.bind(res);
  res.json = (cuerpo) => {
    res.set('Content-Type', 'application/json; charset=utf-8');
    return enviarJson(cuerpo);
  };
  next();
});

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
app.use('/api/perfil', require('./routes/perfil.routes'));
app.use('/api/caja', require('./routes/caja.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/departamentos', require('./routes/departamentos.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/categorias', require('./routes/categorias.routes'));
app.use('/api/movimientos-inventario', require('./routes/movimientos-inventario.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/facturas', require('./routes/facturas.routes'));
app.use('/api/pos', require('./routes/pos.routes'));
app.use('/api/auditoria', require('./routes/auditoria.routes'));
app.use('/api/proveedores', require('./routes/proveedores.routes'));
app.use('/api/compras', require('./routes/compras.routes'));
app.use('/api/ordenes-compra', require('./routes/ordenes-compra.routes'));
app.use('/api/reportes-compras', require('./routes/reporte-compras.routes'));
app.use('/api/rutas', require('./routes/rutas.routes'));
app.use('/api/despachos', require('./routes/despachos.routes'));
app.use('/api/configuracion-empresa', require('./routes/configuracion-empresa.routes'));
app.use('/api/reportes-inventario', require('./routes/reporte-inventario.routes'));
app.use('/api/reportes-ventas', require('./routes/reporte-ventas.routes'));
app.use('/api/reportes', require('./routes/reporte-general.routes'));

// ---------- SPA / catch-all ----------

// Compatibilidad con enlaces internos antiguos sin el prefijo /usuarios
// (por ejemplo impresiones abiertas desde un bundle o marcador previo).
app.get(
  ['/compras', '/compras/*', '/inventario', '/inventario/*', '/reportes', '/reportes/*'],
  (req, res) => {
    res.redirect(302, `/usuarios${req.originalUrl}`);
  }
);

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

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor SGIFEP corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;