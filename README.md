# SGIFEP - Ferretería El Puente

Landing page + sistema de gestión con backend en **Node.js (Express) + MySQL** y el
módulo (**Usuarios, Roles y Departamentos**) en **React 18 + Vite**. Tres proyectos
npm separados (uno por entrada) en un solo repositorio.

## Estructura

```
repo-raiz/
├── landing/            Landing page (Vite, HTML+CSS multi-página)     → puerto 5173
├── sistema/
│   └── frontend/       Sistema React 18 + Vite (módulo de usuarios)   → puerto 5174
├── backend/            API Express + despliegue del sistema           → puerto 3000
│   ├── routes/         Rutas HTTP (definen autenticación y permisos)
│   ├── controllers/    Capa delgada (HTTP/JSON)
│   ├── services/       Reglas de negocio
│   ├── repositories/   Acceso a datos (SQL) — Repository Pattern
│   ├── dtos/           Validación y serialización de entradas/salidas
│   ├── middlewares/    JWT (`autenticar`, `requerirRoles`) y errores
│   ├── migrations/     Migraciones de base de datos por número
│   └── public/         Sistema ya compilado + login/modulos/img
└── database/scripts/   Migraciones y scripts SQL (legacy, manual)
```

- **Desarrollo**: landing en `http://localhost:5173`, sistema en
  `http://localhost:5174/usuarios/`, API en `http://127.0.0.1:3000`.
- **Producción**: un solo servidor Express (3000), donde `/` sirve la landing,
  `/usuarios/` el módulo React, y `/login.html`/`/modulos.html` el login y el
  panel clásico.

## Requisitos

- Node.js 18+ (probado con Node 24)
- MySQL / MariaDB corriendo localmente (configuración en `backend/.env`)

## 1) Base de datos (migración)

Ejecutar una sola vez las migraciones:

```
mysql -u root -p < database/scripts/002_usuarios_roles_departamentos.sql
```

En la migración `002` no se conecta a la base de datos; **quién ya la corrió, no
la repita**. Después de aplicarla, ejecutar la migración del backend (una vez):

```
cd backend
npm install
npm run migrate        # aplica backend/migrations/003_superadmin.sql
```

También puede ejecutarse desde MySQL Workbench o phpMyAdmin. Usa la base de
datos configurada en `backend/.env` (por defecto `sgifep_db`).

**Qué hace:** crea `departamentos`, `roles` y `usuario_roles`; agrega columnas a
`usuarios` (`apellido`, `codigo` único, `departamento_id` FK, `actualizado_en`);
inserta 6 departamentos, 6 roles y vincula el `admin` existente al rol
`administrador`. La migración `003_superadmin.sql` agrega `roles.superadmin`
(sincronizado con el legacy `acceso_total`) y habilita la seguridad JWT.

## 2) Backend (API y producción)

```
cd backend
npm install
npm start            # http://127.0.0.1:3000  (lee backend/.env)
```

Para crear (o reparar) la base y el usuario inicial `admin` / `admin123`:

```
npm run seed         # idempotente: crea tablas, siembra catálogos y garantiza admin ACTIVO
```

> **Si el login devuelve 500**: asegúrese de que `seed.js` y `npm run migrate`
> se ejecutaron (el inicio de sesión consulta `roles`/`usuario_roles`). Ambos
> scripts son idempotentes y pueden ejecutarse varias veces sin dañar datos.

## 3) Landing (desarrollo)

```
cd landing
npm install
npm run dev           # http://localhost:5173
```

El botón "Acceso al sistema" apunta por defecto a
`http://localhost:5174/login.html` (desarrollo) o `/login.html` (producción).
Puede sobreescribirse con `VITE_SISTEMA_LOGIN_URL` (ver `landing/.env.example`).

## 4) Sistema (desarrollo)

```
cd sistema/frontend
npm install
npm run dev           # http://localhost:5174/usuarios/
```

El proxy de Vite reenvía `/api` hacia `http://127.0.0.1:3000`. Con `base:
'/usuarios/'`, Vite sirve `public/` bajo `/usuarios/*`; `vite.config.js` reescribe
`/login.html`, `/modulos.html` y `/img/*` para que esas URLs funcionen igual que
en producción.

## 5) Build de producción

```
# Landing (se sirve en la raíz de Express):
cd landing
npm run build            # genera landing/dist

# Sistema (build + copia automática al backend):
cd sistema/frontend
npm run build:deploy     # vite build + scripts/deploy.mjs
```

`scripts/deploy.mjs` copia el build a `backend/public/usuarios/` y
`login.html`, `modulos.html` e `img/` a `backend/public/`. Con el backend en
marcha el sistema queda en `http://servidor:3000/usuarios/` (Express ya incluye
el catch-all para rutas internas de React como `/usuarios/reporte`).

## Notas importantes

- **Roles y departamentos SIEMPRE se leen de la base** (`GET /api/roles`,
  `GET /api/departamentos`); no hay valores quemados en el frontend. El modal
  de usuario los pide por su cuenta si aún no están cargados.
- Un usuario puede tener **uno o varios roles** (tabla puente `usuario_roles`).
  `roles.superadmin` marca acceso total y se mantiene sincronizado con el
  legacy `acceso_total`.
- **Las contraseñas se guardan con bcryptjs**. En edición, dejar el campo
  contraseña vacío mantiene la actual.
- **Seguridad JWT:** `/api/login` y `/api/reset-password` son los únicos
  endpoints públicos. El resto exige `Authorization: Bearer <token>`; las
  escrituras (`POST`/`PUT`/`PATCH`/`DELETE`) además exigen rol `administrador`
  o `superadmin` (verificado en el backend, no solo en el cliente). Los tokens
  expiran a las 8 h.
- El listado de usuarios soporta filtros `q`, `estado`, `departamento`, `rol` y
  rango de fechas (`startDate`/`endDate`); la búsqueda por texto es en tiempo
  real (debounce) y el listado/reporte se pueden **exportar a CSV** e
  **imprimir** (el reporte).
- `server.js` usa un **pool centralizado** en `backend/db.js`, reutilizado por
  login, reset-password y las rutas MVC (los `repositories/` usan una
  `connection` de `getConnection()` cuando hay transacciones).
- La sesión se guarda en `localStorage['session']` (creada por `login.html`) e
  **incluye el JWT** (`token`); `src/services/api.js` lo adjunta a cada
  petición y, ante un 401, limpia la sesión y redirige a `/login.html`. El
  Layout del módulo React exige token y sin él redirige al login.
- En desarrollo (5174), el enlace "Volver a la página principal" de
  `login.html` cae en `/usuarios/index.html` (la aplicación React); en
  producción apunta a la landing (`/index.html`).
- **Flujo Git:** `main` siempre estable y desplegable; el desarrollo va en
  ramas `feature/*`, integradas a `main` solo tras verificar.
- El `.gitignore` de la raíz ignora `node_modules/`, `.env` y `dist/`.
  **Ojo:** en este repo `node_modules/` y `backend/.env` fueron commiteados
  antes de existir un `.gitignore` válido (el archivo `backend/gitignore` no
  tiene punto y no ignora nada). Si se desea sacarlos del control de versiones
  en el futuro: `git rm -r --cached backend/node_modules backend/.env`.