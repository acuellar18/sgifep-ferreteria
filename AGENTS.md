# AGENTS.md

SGIFEP - Ferretería El Puente. Repo único con tres proyectos npm independientes (no hay `package.json` raíz): `landing/` (Vite HTML+CSS multi-página), `sistema/frontend/` (React 18 + Vite) y `backend/` (Express + MySQL). Los SQL viven en `database/scripts/` y `backend/migrations/`.

## Comandos
- Backend: `npm start` en `backend/` (puerto `PORT`, por defecto 3000).
- Seed: `npm run seed` en `backend/` (idempotente; crea tablas, catálogos y garantiza `admin`/`admin123` ACTIVO con rol `administrador`). **Reejecutarlo resetea la contraseña de `admin` a `admin123`**.
- Migraciones backend: `npm run migrate` en `backend/` — ejecuta en orden todos los `backend/migrations/*.sql` (`003_superadmin`, `004_productos`, `005_compras`, `006_compras_esquema`, `007_compras_triggers`, `008_compras_rediseno`, `009_inventario_esquema`, `010_inventario_permisos`, `011_inventario_servicios`). La `002` es manual y se corre una sola vez.
- Datos demo de Compras: `npm run reiniciar-compras` en `backend/` (borra proveedores/productos/compras/órdenes/pagos/movimientos y ejecuta el seed). Verificar con `npm run verificar-compras`; probar permisos con `npm run probar-permisos-compras`, reportes con `npm run probar-reportes-compras`, Inventario con `npm run probar-reportes-inventario`, esquema/stock/permisos con `npm run probar-inventario`, Categorías con `npm run probar-categorias` y Productos/imágenes con `npm run probar-productos`.
- Landing dev: `npm run dev` en `landing/` (5173). Build: `npm run build` → `landing/dist`.
- Sistema dev: `npm run dev` en `sistema/frontend/` (5174, base `/usuarios/`, proxy `/api` → `http://127.0.0.1:3000`). Producción: `npm run build:deploy` (build + copia a `backend/public/`).
- No hay framework de test, lint ni typecheck. Verificar con `npm run build` en los frontends, `node --check <archivo>` en el backend y los scripts `verificar-compras`, `probar-permisos-compras`, `probar-reportes-compras`, `probar-reportes-inventario`, `probar-inventario`, `probar-categorias` y `probar-productos`.

## Backend y base de datos
- `backend/db.js` carga `backend/.env` por `__dirname` (no depende del cwd) y exporta un pool singleton. `backend/.env` no está versionado.
- Claves actuales de `.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=sgifep_db`, `PORT`. **No hay `JWT_SECRET`**, así que se usa el fallback de desarrollo de `config/auth.js`; definirlo antes de producción.
- `database/scripts/schema.sql` es solo referencia y crea `sgifep_ferreteria` (no coincide con `sgifep_db`). No usarlo para levantar el entorno.
- `004_productos.sql` y `005_compras.sql` usan `CREATE INDEX IF NOT EXISTS` (sintaxis MariaDB); en MySQL 8 pueden fallar.
- Respetar el layering `routes/` (HTTP + permisos) → `controllers/` → `services/` → `repositories/` (solo SQL), con validación/serialización en `dtos/`.
- `/api/login` y `/api/reset-password` son los únicos endpoints públicos. El resto exige `Authorization: Bearer <token>` (`autenticar`). Compras y Usuarios usan `requerirRoles`; Inventario usa permisos granulares de `permisos`/`permisos_rol` mediante `cargarPermisos` y `requerirPermiso`. Tokens de 8 h.
- Roles y departamentos siempre se leen de la BD; no hardcodearlos. Un usuario puede tener varios roles (`usuario_roles`).
- Stock/costo solo cambia con `trg_movimientos_before_insert`; ningún endpoint actualiza `stock_actual`. Los permisos sin `inventario.productos.ver_costos` no reciben `costo_ultimo` ni `costo_promedio` en la API. Los productos `tipo='servicio'` no tienen stock ni movimientos: el trigger de `011` los rechaza y compras/reportes los excluyen.
- Imágenes de productos: se guardan procesadas con `sharp` en `backend/storage/productos/` (ignorado por Git) y se sirven por endpoints autenticados `GET /api/productos/:id/imagen` y `/imagen/miniatura`; no son archivos públicos.
- No agregar registro público: el alta de usuarios es solo por administrador (`POST /api/usuarios`); es una decisión de diseño.

## Sistema frontend
- SPA con `base: '/usuarios/'` y `basename="/usuarios"`; en producción Express la sirve desde `backend/public/usuarios/` y hace catch-all de `/usuarios/*`. Las rutas internas antiguas sin prefijo (`/compras/*`, `/inventario/*`, `/reportes/*`) redirigen a `/usuarios...` para no romper impresiones o marcadores previos.
- `src/services/api.js` lee `localStorage['session']`, inyecta el JWT y ante 401 limpia la sesión y redirige a `/login.html`. La sesión la crea `login.html` con `{ nombre, username, rol, roles[], superadmin, token }`.
- `vite.config.js` incluye el plugin `reescribir-rutas-sistema`: en dev reescribe `/login.html`, `/modulos.html` e `/img/*` a `/usuarios/*`. Debe ser un plugin; `configureServer` anidado en `server` se ignora.
- Landing: `landing/src/login.js` configura los enlaces `data-login-url`. En dev el destino real es `http://localhost:5174/usuarios/login.html`; en producción `/login.html`.

## Estado de los módulos
- Implementados contra la API y en React: **Usuarios/Roles/Departamentos** y **Compras** (compras, proveedores, órdenes y reporte con filtros, CSV, Excel/PDF).
- **Inventario** tiene el reporte React en `/reportes/inventario` contra `GET /api/reportes-inventario/resumen`, el esquema de stock/costos (`009`), los permisos granulares (`010`), la regla de servicios (`011`), la gestión React de **Categorías** en `/inventario/categorias` contra `/api/categorias` y la gestión React de **Productos** en `/inventario/productos` contra `/api/productos`, con inventario inicial, filtros e imágenes privadas. **Movimientos** sigue como página "en construcción" hasta la siguiente fase. Facturación, Despacho y Reportes aún son páginas HTML estáticas en `sistema/frontend/public/<modulo>/`.
- Categorías: administrador puede crear/editar/inactivar/eliminar; compras y bodega solo consultan; caja, ventas y reparto no ven el submenú. Una categoría con productos asociados no se puede eliminar.
- Productos: administrador, compras y bodega gestionan y ven costos; caja, ventas y reparto solo consultan (sin costos); solo administrador elimina. El inventario inicial genera un movimiento `inventario_inicial`; no se puede convertir un producto con existencias en servicio. Un producto con movimientos/compras/órdenes no se elimina, solo se inactiva.
- `public/compras/*.html` son restos estáticos; el menú real apunta a las rutas React `/usuarios/compras...`.
- `scripts/deploy.mjs` copia `dist/assets`, `index.html`, `login.html`, `modulos.html`, `img/` y `public/assets-modulos`; **no copia** las carpetas estáticas `facturacion/`, `despacho/` ni `reportes/` a `backend/public/`, por lo que en producción esos enlaces pueden dar 404 hasta copiarlas.
- La navegación interna usa `react-router` con `<Outlet/>`; el regreso al panel es `/usuarios/modulos.html` (nunca rutas sin compilar como `/modulos.html`).

## Línea gráfica (contrato)
- Paleta: fondos `#f8f9fa`/blanco, header/drawer antracita `#141414`, acento naranja `#ea580c`/`#d97706` para interacción. **Sin azules** y sin caja blanca alrededor del logo.
- El logo se importa como módulo React (`src/assets/logo.png` en `Layout.jsx`); en HTML estático usar siempre `/img/logo.png` (absoluto).
- El drawer se abre con `.menu-toggle`, alterna `.drawer.drawer-abierto` en Flexbox tipo push (sin overlay) y usa acordeones por módulo.

## Gotchas
- `backend/node_modules/` sigue versionado (≈1000 archivos) pese al `.gitignore`: evitar `git add -A` para no commitear dependencias.
- `backend/public/` contiene artefactos compilados versionados; tras cambiar el frontend ejecutar `npm run build:deploy` para no dejar producción desactualizada.
- `landing/dist` debe existir para que Express sirva la raíz; si falta, responde con un aviso de texto.
- Git: `main` siempre desplegable; trabajar en ramas `feature/*` y no commitear trabajo incompleto en `main`. Mensajes, comentarios y UI en español.
- Este repo es autocontenido aunque exista otro `sgifep-ferreteria` en disco; no tratarlo como monorepo.
