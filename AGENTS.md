# AGENTS.md

SGIFEP - Ferretería El Constructor. Monorepo with two sibling npm projects: `backend/` (Express + MySQL, also serves the site static files) and `frontend/` (React 18 + Vite: the "Usuarios, Roles, Departamentos" module). React production build ships to `backend/public/usuarios/`.

## Commands
- Backend: `npm start` in `backend/` (`node server.js`, port from `PORT`, default 3000). `backend/db.js` loads `backend/.env` via `__dirname`, so env loading no longer depends on the shell cwd.
- Backend seed: `npm run seed` in `backend/` — upserts user `admin` / `admin123`, links it to role `administrador`.
- DB migration: run `backend/migrations/002_usuarios_roles_departamentos.sql` once (creates `departamentos`, `roles`, `usuario_roles`; extends `usuarios`).
- Frontend: `npm install && npm run dev` in `frontend/` (serves at http://localhost:5173/usuarios/, proxies `/api` → `http://127.0.0.1:3000`). Production: `npm run build` then copy `frontend/dist/*` → `backend/public/usuarios/`.

No test, lint, or typecheck tooling exists.

## Setup
- Config via `backend/.env` (requires `dotenv`). Committed values point at local MySQL: `DB_NAME=sgifep_db`, no password.
- `backend/schema.sql` is manual-reference only: it creates database `sgifep_ferreteria`, which does NOT match `.env` (`sgifep_db`). The runtime schema is `backend/migrations/002_usuarios_roles_departamentos.sql`.
- One pool shared by everything: `backend/db.js` (login, reset-password, and `/routes/*.js`).
- Roles/departamentos are always read from the DB (`/api/roles`, `/api/departamentos`) — never hardcode them in backend or frontend.
- A user can have one or several roles via `usuario_roles`. The legacy `usuarios.rol` column is kept only for the vanilla `login.html`/`modulos.html` flow.
- The React module is client-side role-gated via `localStorage['session']` (created by `login.html`); `/usuarios/*` SPA routes fall through the Express catch-all in `server.js`.

## Gotchas
- `backend/gitignore` (no leading dot) is tracked and ignored by git as a normal file: `node_modules/` and `backend/.env` are committed. A valid root `.gitignore` now exists (node_modules/, .env, dist/) for new files, but already-tracked files stay tracked until `git rm --cached`.
- `/api/login` only bcrypt-verifies the password and returns `{usuario: {nombre, rol}}`. There is no session/token: access control is client-side. No backend endpoint is actually protected.
- API responses use Spanish `mensaje` fields; error shapes differ (400/401/403/404/409/500).
- API responses use Spanish `mensaje` fields; error shapes differ (400/401/403/404/500).

## Conventions
- Code comments, UI text, and commit messages are in Spanish (e.g. "Actualizar rutas de archivos estaticos a public"). Match this when writing.
- Despite `sgifep-ferreteria` elsewhere on disk, this is its own self-contained repo; do not treat it as part of a monorepo.