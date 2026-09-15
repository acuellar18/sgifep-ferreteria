# SGIFEP - Ferretería El Constructor

Sistema web con backend en **Node.js (Express) + MySQL** y el primer módulo real
(**Usuarios, Roles y Departamentos**) en **React 18 + Vite**.

## Estructura

```
repo-raiz/
├── backend/    API Express + estáticos del sitio + build del módulo de usuarios
└── frontend/   Aplicación React/Vite del módulo de usuarios
```

## Requisitos

- Node.js 18+ (probado con Node 24)
- MySQL / MariaDB corriendo localmente (configuración en `backend/.env`)

## 1) Base de datos (migración)

Ejecutar una sola vez la migración:

```
mysql -u root -p < backend/migrations/002_usuarios_roles_departamentos.sql
```

También puede ejecutarse desde MySQL Workbench o phpMyAdmin. Usa la base de
datos configurada en `backend/.env` (por defecto `sgifep_db`).

**Qué hace:** crea `departamentos`, `roles` y `usuario_roles`; agrega columnas a
`usuarios` (`apellido`, `codigo` único, `departamento_id` FK, `actualizado_en`);
inserta 6 departamentos, 6 roles y vincula el `admin` existente al rol
`administrador`. No rompe la tabla `usuarios` existente.

## 2) Backend

```
cd backend
npm install
npm start            # http://127.0.0.1:3000  (lee backend/.env)
```

Para crear el usuario inicial `admin` / `admin123` (si no existe):

```
npm run seed
```

## 3) Frontend (desarrollo)

```
cd frontend
npm install
npm run dev           # http://localhost:5173/usuarios/
```

El proxy de Vite reenvía `/api` hacia `http://127.0.0.1:3000`, por lo que no se
necesita configuración extra de CORS en desarrollo.

## 4) Build de producción

```
cd frontend
npm run build         # genera dist/ con base /usuarios/
# Copiar el resultado al backend:
robocopy dist ..\backend\public\usuarios /E        # Windows
# o: cp -r dist/* ../backend/public/usuarios/
```

En producción el módulo queda en `http://servidor:3000/usuarios/`, servido por
Express (`server.js` incluye el catch-all para rutas internas de React como
`/usuarios/reporte`).

## Notas importantes

- **Roles y departamentos SIEMPRE se leen de la base** (`GET /api/roles`,
  `GET /api/departamentos`); no hay valores quemados en el frontend.
- Un usuario puede tener **uno o varios roles** (tabla puente `usuario_roles`).
- Las contraseñas se guardan con **bcryptjs**. En edición, dejar el campo
  contraseña vacío mantiene la actual.
- `server.js` usa un **pool centralizado** en `backend/db.js`, reutilizado por
  login, reset-password y las rutas nuevas.
- La sesión sigue usando `localStorage['session']` (creada por `login.html`);
  el Layout del módulo React la reutiliza y sin sesión redirige a `/login.html`.
- El `.gitignore` de la raíz ignora `node_modules/`, `.env` y `dist/`.
  **Ojo:** en este repo `node_modules/` y `backend/.env` fueron commiteados
  antes de existir un `.gitignore` válido (el archivo `backend/gitignore` no
  tiene punto y no ignora nada). Si se desea sacarlos del control de versiones
  en el futuro: `git rm -r --cached backend/node_modules backend/.env`.