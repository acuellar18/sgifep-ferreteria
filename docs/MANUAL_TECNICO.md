# MANUAL TÉCNICO

## SGIFEP — Sistema de Gestión Integral para Ferretería El Puente

---

# 1. PORTADA

| Campo | Información |
|---|---|
| Nombre del proyecto | SGIFEP — Sistema de Gestión Integral para Ferretería El Puente |
| Tipo de entrega | Entrega en la nube |
| Curso | Análisis de Sistemas |
| Carrera | [Completar carrera] |
| Universidad | [Completar universidad] |
| Docente | [Completar nombre del docente] |
| Integrantes | [Completar nombres y carné] |
| Sección / Jornada | [Completar] |
| Fecha de entrega | [Completar fecha] |
| Versión del documento | 1.0 |

> **Importante:** los datos entre corchetes `[Completar]` deben sustituirse por la información real antes de la entrega.

---

# 2. CARÁTULA

**Proyecto:** SGIFEP — Sistema de Gestión Integral para Ferretería El Puente

**Descripción breve:** Sistema web compuesto por una landing page pública, un sistema administrativo con módulos de usuarios, inventario, compras, facturación, caja, despacho, reportes y seguridad, y una API REST conectada a una base de datos MySQL. La entrega se realiza en la nube sobre un servidor Linux con Node.js, MySQL y Nginx.

**Entorno de producción:**

| Elemento | Valor |
|---|---|
| Dominio | [Completar dominio, por ejemplo: https://ferreteriaelpuente.com] |
| URL del sistema | [Completar, por ejemplo: https://dominio.com/usuarios/] |
| URL del login | [Completar, por ejemplo: https://dominio.com/login.html] |
| Repositorio de código | [Completar URL del repositorio] |
| Rama desplegada | `main` |

**Elaborado por:** [Completar integrantes]

**Fecha:** [Completar fecha]

---

# 3. ÍNDICE

1. [Portada](#1-portada)
2. [Carátula](#2-carátula)
3. [Índice](#3-índice)
4. [Introducción](#4-introducción)
5. [Objetivo general y objetivos específicos](#5-objetivo-general-y-objetivos-específicos)
6. [Stack de tecnologías](#6-stack-de-tecnologías)
7. [Arquitectura de carpetas del proyecto](#7-arquitectura-de-carpetas-del-proyecto)
8. [Requisitos mínimos para los servidores](#8-requisitos-mínimos-para-los-servidores)
9. [Requisitos mínimos para el cliente](#9-requisitos-mínimos-para-el-cliente)
10. [Configuración e implementación de la base de datos](#10-configuración-e-implementación-de-la-base-de-datos)
11. [Configuración e implementación del backend](#11-configuración-e-implementación-del-backend)
12. [Configuración e implementación del frontend](#12-configuración-e-implementación-del-frontend)
13. [Backup de la base de datos](#13-backup-de-la-base-de-datos)
14. [Anexos](#14-anexos)

---

# 4. INTRODUCCIÓN

SGIFEP es un sistema de gestión integral desarrollado para Ferretería El Puente. Su propósito es centralizar las operaciones administrativas y comerciales del negocio: gestión de usuarios y roles, control de inventario, registro de compras a proveedores, facturación, ventas de punto de venta (POS), cobros de crédito, control de caja, despachos y rutas de entrega, reportes gerenciales y auditoría de acciones.

El proyecto está organizado en tres aplicaciones npm independientes dentro de un mismo repositorio:

- `landing/`: página web pública (sitio multi-página en HTML y CSS, compilado con Vite).
- `sistema/frontend/`: sistema administrativo desarrollado en React 18 con Vite.
- `backend/`: API REST desarrollada con Node.js y Express, con acceso a MySQL mediante el patrón repositorio.

En producción, un único servidor Express publica la landing en la raíz del dominio, el sistema administrativo bajo `/usuarios/` y la API bajo `/api`. La base de datos MySQL almacena toda la información y aplica reglas críticas de negocio mediante triggers, por ejemplo, la actualización automática del stock y del costo de los productos a partir de los movimientos de inventario.

La comunicación entre el frontend y el backend se realiza mediante JSON sobre HTTP, protegida con autenticación JWT. Los permisos se validan en el backend, que es la autoridad real, mientras que el frontend adapta la interfaz según el rol y los permisos del usuario autenticado.

---

# 5. OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS

## 5.1 Objetivo general

Implementar y desplegar en la nube un sistema web integral que permita a Ferretería El Puente administrar de forma segura y centralizada sus usuarios, inventario, compras, ventas, facturación, caja, despachos y reportes, garantizando la integridad de los datos y el control de acceso por roles.

## 5.2 Objetivos específicos

1. Diseñar una base de datos relacional en MySQL que soporte los procesos de usuarios, inventario, compras, facturación, ventas, caja y despacho.
2. Implementar una API REST con Node.js y Express bajo una arquitectura por capas (rutas, controladores, servicios y repositorios).
3. Implementar autenticación y autorización mediante JWT, roles y permisos granulares.
4. Desarrollar una interfaz web administrativa en React 18 y una landing page pública.
5. Garantizar la integridad del inventario y del costo de los productos mediante triggers en la base de datos.
6. Desplegar la aplicación en un servidor en la nube con HTTPS, dominio, variables de entorno seguras y respaldos automáticos.
7. Documentar los procedimientos de instalación, configuración, operación y recuperación del sistema.

---

# 6. STACK DE TECNOLOGÍAS

## 6.1 Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18 o superior (probado con Node 24) | Entorno de ejecución del servidor |
| Express | ^4.19.2 | Framework HTTP y API REST |
| MySQL / MariaDB | MySQL 8 o MariaDB 10.6+ | Base de datos relacional |
| mysql2 | ^3.11.0 | Conexión y pool de conexiones |
| jsonwebtoken | ^9.0.3 | Autenticación mediante JWT |
| bcryptjs | ^2.4.3 | Hash de contraseñas |
| multer | ^2.4.0 | Carga de archivos adjuntos e imágenes |
| sharp | ^0.33.5 | Procesamiento y miniaturas de imágenes |
| nodemailer | ^10.2.1 | Envío de correos (contacto y recuperación de contraseña) |
| dotenv | ^16.4.5 | Variables de entorno |
| cors | ^2.8.5 | Control de acceso HTTP |

## 6.2 Frontend del sistema

| Tecnología | Versión | Uso |
|---|---|---|
| React | ^18.3.1 | Interfaz de usuario |
| React DOM | ^18.3.1 | Renderizado |
| React Router DOM | ^6.28.1 | Navegación SPA |
| Vite | ^5.4.11 | Servidor de desarrollo y compilación |
| Axios | ^1.7.9 | Cliente HTTP |
| Chart.js / react-chartjs-2 | ^4.5.1 / ^5.3.1 | Gráficas de reportes |
| html5-qrcode | ^2.3.8 | Lectura de códigos de barras |
| html2canvas | ^1.4.1 | Captura de elementos para impresión |
| jsPDF / jspdf-autotable | ^4.2.1 / ^5.0.8 | Generación de documentos PDF |
| xlsx | ^0.18.5 | Exportación a Excel |

## 6.3 Landing page

| Tecnología | Versión | Uso |
|---|---|---|
| HTML5 y CSS3 | — | Sitio público multi-página |
| Vite | ^5.4.11 | Compilación del sitio estático |

## 6.4 Infraestructura y seguridad

| Tecnología | Uso |
|---|---|
| Ubuntu Server 22.04 LTS | Sistema operativo del servidor en la nube |
| Nginx | Proxy inverso y terminación HTTPS |
| PM2 | Gestor de procesos de Node.js |
| Certbot / Let's Encrypt | Certificado SSL gratuito |
| UFW | Cortafuegos del servidor |
| OpenSSH | Administración remota segura |

---

# 7. ARQUITECTURA DE CARPETAS DEL PROYECTO

```text
files/
├── landing/                       Página web pública
│   ├── index.html
│   ├── contacto.html
│   ├── nosotros.html
│   ├── ubicacion.html
│   ├── landing.css
│   ├── src/login.js
│   ├── public/img/
│   ├── vite.config.js
│   └── package.json
│
├── sistema/
│   └── frontend/                  Sistema administrativo React
│       ├── index.html
│       ├── vite.config.js
│       ├── package.json
│       ├── public/
│       │   ├── login.html
│       │   ├── modulos.html
│       │   ├── restablecer.html
│       │   ├── assets-modulos/
│       │   └── img/
│       ├── scripts/
│       │   ├── deploy.mjs
│       │   └── sincronizar-sidebar.mjs
│       ├── src/
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   ├── assets/
│       │   ├── components/
│       │   ├── config/
│       │   ├── pages/
│       │   │   ├── Caja/
│       │   │   ├── Compras/
│       │   │   ├── Departamentos/
│       │   │   ├── Despacho/
│       │   │   ├── Facturacion/
│       │   │   ├── Inventario/
│       │   │   ├── Modulos/
│       │   │   ├── Perfil/
│       │   │   ├── Reportes/
│       │   │   ├── Roles/
│       │   │   ├── Seguridad/
│       │   │   └── Usuarios/
│       │   ├── services/
│       │   ├── styles/
│       │   └── utils/
│       └── dist/                  Build generado (no versionado)
│
├── backend/                       API REST y servidor de producción
│   ├── server.js
│   ├── db.js
│   ├── seed.js
│   ├── seed-compras.js
│   ├── config/
│   │   └── auth.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── dtos/
│   ├── middlewares/
│   ├── migrations/
│   │   ├── 003_superadmin.sql ... 033_despacho_pos.sql
│   │   └── reversos/
│   ├── scripts/
│   ├── public/                    Build desplegado del sistema
│   │   ├── login.html
│   │   ├── modulos.html
│   │   ├── restablecer.html
│   │   ├── assets-modulos/
│   │   ├── img/
│   │   └── usuarios/
│   ├── storage/                   Archivos privados (no versionado)
│   │   ├── productos/
│   │   ├── compras/
│   │   └── perfiles/
│   ├── .env                       Variables de entorno (no versionado)
│   └── package.json
│
├── database/
│   └── scripts/
│       ├── 002_usuarios_roles_departamentos.sql
│       ├── 023_password_reset.sql
│       ├── 024_despachos.sql
│       ├── 025_corregir_textos.sql
│       ├── 025_rutas_entregas.sql
│       └── schema.sql             Archivo de referencia, no usar en producción
│
├── docs/
│   └── MANUAL_TECNICO.md
├── .gitignore
├── AGENTS.md
└── README.md
```

## 7.1 Organización del backend por capas

| Carpeta | Responsabilidad |
|---|---|
| `routes/` | Define las rutas HTTP y aplica autenticación y permisos |
| `controllers/` | Recibe la petición, valida la entrada y devuelve la respuesta JSON |
| `services/` | Contiene las reglas de negocio |
| `repositories/` | Ejecuta exclusivamente las consultas SQL |
| `dtos/` | Validación y serialización de datos |
| `middlewares/` | JWT, permisos, seguridad HTTP, carga de archivos y manejo de errores |

Regla de dependencia obligatoria:

```text
routes -> controllers -> services -> repositories -> base de datos
```

Los controladores no ejecutan SQL y los repositorios no contienen reglas de negocio.

---

# 8. REQUISITOS MÍNIMOS PARA LOS SERVIDORES

## 8.1 Servidor de aplicación y base de datos

| Recurso | Mínimo | Recomendado |
|---|---|---|
| Procesador | 2 vCPU | 2 a 4 vCPU |
| Memoria RAM | 2 GB | 4 GB |
| Disco | 20 GB SSD | 40 GB SSD o más |
| Sistema operativo | Ubuntu Server 22.04 LTS | Ubuntu Server 22.04 LTS |
| Ancho de banda | 5 Mbps | 20 Mbps o superior |
| Dirección IP | IP pública fija | IP pública fija |
| Puertos abiertos | 22 (SSH), 80 (HTTP), 443 (HTTPS) | 22 restringido por IP, 80 y 443 |
| Node.js | 18 o superior | 20 LTS o 24 |
| MySQL / MariaDB | MySQL 8.0 o MariaDB 10.6 | MySQL 8.0 |
| Servidor web | Nginx 1.18+ | Nginx estable |
| Gestor de procesos | PM2 | PM2 con arranque automático |

## 8.2 Servicios del servidor

| Servicio | Función |
|---|---|
| `nginx` | Recibe el tráfico público y redirige a Node.js |
| `mysql` | Motor de base de datos |
| `pm2` | Mantiene activa la aplicación Node.js |
| `ufw` | Cortafuegos |
| `certbot` | Renovación automática del certificado SSL |
| `cron` | Ejecución de respaldos programados |

## 8.3 Notas de dimensionamiento

- El servidor atiende landing, sistema y API desde un solo proceso Node.js.
- Las imágenes de productos y los adjuntos de compras se almacenan en disco; por ello se recomienda planificar el crecimiento del almacenamiento.
- Si el volumen de usuarios crece, se recomienda separar la base de datos en un servidor independiente y agregar un balanceador de carga.

---

# 9. REQUISITOS MÍNIMOS PARA EL CLIENTE

## 9.1 Equipo del usuario

| Recurso | Mínimo | Recomendado |
|---|---|---|
| Procesador | Dual core 1.6 GHz | Core i3 o superior |
| Memoria RAM | 4 GB | 8 GB |
| Resolución de pantalla | 1366 x 768 | 1920 x 1080 |
| Disco libre | 500 MB | 1 GB |
| Conectividad | Internet de 2 Mbps | Internet de 10 Mbps |

## 9.2 Navegador web

| Navegador | Versión mínima |
|---|---|
| Google Chrome | 90 o superior |
| Microsoft Edge | 90 o superior |
| Mozilla Firefox | 88 o superior |
| Safari | 14 o superior |

Requisitos adicionales:

- JavaScript habilitado.
- Cookies y almacenamiento local (`localStorage`) habilitados.
- Permiso de cámara únicamente si se utiliza el escáner de códigos de barras del POS.
- Acceso a Internet para el sistema en la nube.

## 9.3 Dispositivos opcionales

- Lector de códigos de barras compatible con entrada de teclado (modo HID).
- Impresora térmica de 80 mm para tickets del POS.
- Impresora convencional para facturas y reportes.

---

# 10. CONFIGURACIÓN E IMPLEMENTACIÓN DE LA BASE DE DATOS

## 10.1 Crear la base de datos y el usuario

Conectarse al servidor MySQL como administrador:

```bash
sudo mysql -u root -p
```

Ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS sgifep_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'sgifep_user'@'localhost'
  IDENTIFIED BY 'CAMBIAR_ESTA_CONTRASENA';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, TRIGGER, REFERENCES
  ON sgifep_db.* TO 'sgifep_user'@'localhost';

FLUSH PRIVILEGES;
```

> En producción no se debe utilizar el usuario `root` para la aplicación. El usuario de la base de datos debe tener únicamente los privilegios necesarios.

## 10.2 Importar el esquema inicial

El archivo `database/scripts/002_usuarios_roles_departamentos.sql` se ejecuta **una sola vez** sobre una base nueva. Crea las tablas `departamentos`, `roles` y `usuario_roles`, extiende la tabla `usuarios` y siembra los catálogos iniciales.

```bash
mysql --default-character-set=utf8mb4 -u sgifep_user -p sgifep_db \
  < database/scripts/002_usuarios_roles_departamentos.sql
```

> Importante: usar siempre `--default-character-set=utf8mb4` para evitar que las tildes y caracteres especiales se conviertan en `?`.

## 10.3 Ejecutar las migraciones del backend

Las migraciones se encuentran en `backend/migrations/` y se ejecutan en orden numérico del `003` al `033`. No existe tabla de control de migraciones: cada archivo debe ser idempotente y puede ejecutarse nuevamente sin dañar los datos.

```bash
cd backend
npm install
npm run migrate
```

El script `migrate.js`:

- Lee las variables de `backend/.env`.
- Ordena los archivos `.sql` alfabéticamente.
- Soporta la directiva `DELIMITER` para triggers y procedimientos.
- Ignora la carpeta `migrations/reversos/`.

## 10.4 Ejecutar el seed inicial

```bash
cd backend
npm run seed
```

El seed es idempotente y realiza lo siguiente:

- Asegura las tablas `departamentos`, `roles`, `usuarios` y `usuario_roles`.
- Agrega columnas faltantes en bases heredadas.
- Siembra los departamentos y roles por defecto.
- Garantiza el usuario `admin` activo con contraseña `admin123` y rol `administrador`.

> Advertencia: volver a ejecutar `npm run seed` restablece la contraseña del usuario `admin` a `admin123`. En producción, cambiarla inmediatamente después del despliegue.

## 10.5 Tablas principales de la base de datos

| Módulo | Tablas |
|---|---|
| Seguridad y usuarios | `usuarios`, `roles`, `departamentos`, `usuario_roles`, `permisos`, `permisos_rol`, `auditoria_eventos`, `bitacora_auditoria`, `intentos_login`, `login_bloqueos` |
| Recuperación de contraseña | `password_resets`, `password_reset_codigos`, `intentos_reset` |
| Inventario | `categorias`, `productos`, `movimientos_inventario`, `secuencias` |
| Compras | `proveedores`, `ordenes_compra`, `detalle_orden_compra`, `compras`, `detalle_compra`, `pagos_compra`, `producto_proveedor`, `compra_comentarios`, `compra_archivos`, `configuracion_empresa` |
| Facturación y ventas | `clientes`, `facturas`, `detalle_factura`, `ventas`, `detalle_venta`, `cobros`, `devoluciones_venta`, `detalle_devolucion_venta` |
| Caja | `sesiones_caja` |
| Despacho | `despachos`, `despacho_detalle`, `despacho_historial`, `conductores`, `vehiculos`, `rutas`, `ruta_paradas` |

## 10.6 Reglas críticas implementadas en la base de datos

- El stock y el costo de los productos solo cambian mediante el trigger `trg_movimientos_before_insert`. Ningún endpoint actualiza directamente `stock_actual`.
- Los productos de tipo `servicio` no manejan stock ni movimientos de inventario.
- Un movimiento de tipo `ajuste` recibe como `cantidad` el nuevo stock real; el trigger calcula la diferencia y guarda `stock_anterior` y `stock_nuevo`.
- La numeración de facturas utiliza el formato `FAC-AAAA-000000`.
- Las ventas de POS descuentan inventario mediante movimientos con origen `venta`; las anulaciones generan movimientos de reverso.
- Las compras pueden generar inventario según la configuración del sistema.

## 10.7 Verificación de la instalación

```sql
USE sgifep_db;
SHOW TABLES;
SELECT id, username, activo FROM usuarios WHERE username = 'admin';
SELECT nombre, activo FROM roles ORDER BY id;
SELECT COUNT(*) FROM permisos;
```

---

# 11. CONFIGURACIÓN E IMPLEMENTACIÓN DEL BACKEND

## 11.1 Requisitos previos

- Node.js 18 o superior.
- npm 9 o superior.
- MySQL 8 o MariaDB 10.6 en ejecución.
- Base de datos creada y migrada.
- Acceso al repositorio del proyecto.

## 11.2 Instalación de dependencias

```bash
cd backend
npm install
```

## 11.3 Variables de entorno

Crear el archivo `backend/.env` a partir del siguiente ejemplo:

```env
# Servidor
PORT=3000
NODE_ENV=production

# Base de datos
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sgifep_user
DB_PASSWORD=CAMBIAR_ESTA_CONTRASENA
DB_NAME=sgifep_db
DB_TIMEZONE=

# Seguridad
JWT_SECRET=CAMBIAR_POR_UNA_CLAVE_LARGA_Y_ALEATORIA
JWT_EXPIRA_EN=8h

# Correo electrónico
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=correo@dominio.com
SMTP_PASS=CLAVE_DE_APLICACION
MAIL_FROM=Ferretería El Puente <correo@dominio.com>
CONTACTO_EMAIL=correo@dominio.com

# URLs públicas
FRONTEND_URL=https://dominio.com
RESET_PASSWORD_URL=https://dominio.com
```

Notas:

- `JWT_SECRET` es obligatorio cuando `NODE_ENV=production`; el backend no arranca sin él.
- `DB_TIMEZONE` puede dejarse vacío para que el sistema detecte automáticamente la zona horaria de MySQL. En Guatemala se usa `-06:00`.
- El archivo `.env` nunca debe subirse al repositorio ni compartirse en el manual de entrega.
- Para Gmail se debe utilizar una contraseña de aplicación, no la contraseña normal de la cuenta.

## 11.4 Ejecución en desarrollo

```bash
cd backend
npm start
```

La API queda disponible en `http://127.0.0.1:3000`.

## 11.5 Endpoints principales

Todas las rutas se sirven bajo el prefijo `/api`.

| Prefijo | Módulo |
|---|---|
| `/api/login`, `/api/registro`, `/api/reset-password/*` | Autenticación y recuperación de contraseña |
| `/api/contacto` | Formulario público de contacto |
| `/api/usuarios`, `/api/roles`, `/api/departamentos` | Usuarios y seguridad |
| `/api/perfil` | Perfil del usuario autenticado |
| `/api/productos`, `/api/categorias`, `/api/movimientos-inventario` | Inventario |
| `/api/proveedores`, `/api/compras`, `/api/ordenes-compra`, `/api/reportes-compras` | Compras |
| `/api/clientes`, `/api/facturas`, `/api/pos` | Facturación y ventas |
| `/api/caja` | Caja |
| `/api/rutas`, `/api/despachos` | Despacho y entregas |
| `/api/reportes-inventario`, `/api/reportes-ventas`, `/api/reportes` | Reportes |
| `/api/auditoria` | Auditoría del sistema |
| `/api/configuracion-empresa` | Datos de la empresa |

## 11.6 Seguridad implementada

- Autenticación mediante JWT con vigencia de 8 horas.
- Contraseñas almacenadas con bcryptjs.
- Bloqueo temporal tras 5 intentos fallidos de inicio de sesión en 15 minutos.
- Contraseñas de 8 a 72 caracteres con mayúscula, minúscula y número; no pueden contener datos personales.
- Invalidación inmediata de sesiones al cambiar la contraseña mediante el campo `sesiones_version`.
- Autorización por roles y por permisos granulares almacenados en la base de datos.
- Cabeceras de seguridad HTTP: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`.
- Archivos privados servidos únicamente mediante endpoints autenticados.
- Los endpoints de administración validan permisos en el backend, no solo en la interfaz.

## 11.7 Despliegue en el servidor con PM2

```bash
cd /var/www/sgifep/backend
npm install --omit=dev
npm run migrate
npm run seed
pm2 start server.js --name sgifep
pm2 save
pm2 startup
```

Comandos de operación:

```bash
pm2 status
pm2 logs sgifep
pm2 restart sgifep
pm2 stop sgifep
```

## 11.8 Configuración de Nginx como proxy inverso

Archivo `/etc/nginx/sites-available/sgifep`:

```nginx
server {
    listen 80;
    server_name dominio.com www.dominio.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar el sitio y recargar:

```bash
sudo ln -s /etc/nginx/sites-available/sgifep /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Habilitar HTTPS con Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dominio.com -d www.dominio.com
```

## 11.9 Cortafuegos

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

El puerto `3000` no debe exponerse públicamente; solo Nginx debe acceder a él.

## 11.10 Estructura de respuesta de la API

Las respuestas exitosas siguen el formato:

```json
{
  "success": true,
  "data": {}
}
```

Los errores siguen el formato:

```json
{
  "success": false,
  "mensaje": "Descripción del error"
}
```

---

# 12. CONFIGURACIÓN E IMPLEMENTACIÓN DEL FRONTEND

El proyecto contiene dos frontends independientes: la landing page y el sistema administrativo.

## 12.1 Landing page

### Instalación y desarrollo

```bash
cd landing
npm install
npm run dev
```

Disponible en `http://localhost:5173`.

### Compilación para producción

```bash
cd landing
npm run build
```

El resultado se genera en `landing/dist` y el backend lo sirve en la raíz del dominio.

### Variables de entorno opcionales

Archivo `landing/.env`:

```env
VITE_SISTEMA_LOGIN_URL=https://dominio.com/login.html
```

Si no se define, en producción los enlaces apuntan a `/login.html` del mismo dominio.

## 12.2 Sistema administrativo React

### Instalación y desarrollo

```bash
cd sistema/frontend
npm install
npm run dev
```

Disponible en `http://localhost:5174/usuarios/`.

El servidor de desarrollo redirige las peticiones `/api` al backend en `http://127.0.0.1:3000`.

### Variables de entorno opcionales

Archivo `sistema/frontend/.env`:

```env
VITE_API_BASE=/api
```

### Compilación y despliegue

```bash
cd sistema/frontend
npm run build:deploy
```

Este comando ejecuta la sincronización del menú lateral, compila con Vite y copia el resultado a `backend/public/`:

- `dist/assets` → `backend/public/usuarios/assets`
- `dist/index.html` → `backend/public/usuarios/index.html`
- `dist/login.html` → `backend/public/login.html`
- `dist/restablecer.html` → `backend/public/restablecer.html`
- `dist/modulos.html` → `backend/public/modulos.html`
- `dist/img` → `backend/public/img`
- `public/assets-modulos` → `backend/public/assets-modulos`

El sistema queda disponible en `https://dominio.com/usuarios/`.

### Rutas principales del sistema

| Ruta | Módulo |
|---|---|
| `/usuarios/` | Inicio / Gestión de usuarios |
| `/usuarios/reporte` | Reporte de usuarios |
| `/usuarios/roles` | Gestión de roles |
| `/usuarios/departamentos` | Gestión de departamentos |
| `/usuarios/inventario/categorias` | Categorías |
| `/usuarios/inventario/productos` | Productos |
| `/usuarios/inventario/movimientos` | Movimientos de inventario |
| `/usuarios/compras/proveedores` | Proveedores |
| `/usuarios/compras/facturas` | Compras registradas |
| `/usuarios/compras/ordenes` | Órdenes de compra |
| `/usuarios/facturacion/clientes` | Clientes |
| `/usuarios/facturacion/facturas` | Facturas |
| `/usuarios/pos` | Punto de venta |
| `/usuarios/caja` | Caja |
| `/usuarios/despacho` | Despachos |
| `/usuarios/despacho/rutas-entregas` | Rutas de entrega |
| `/usuarios/reportes` | Reporte general |
| `/usuarios/reportes/compras` | Reporte de compras |
| `/usuarios/reportes/ventas` | Reporte de ventas |
| `/usuarios/reportes/inventario` | Reporte de inventario |
| `/usuarios/seguridad/auditoria` | Auditoría |
| `/usuarios/perfil` | Perfil del usuario |

### Autenticación en el frontend

- El login se realiza desde `login.html`.
- La sesión se guarda en `localStorage` con la clave `session`.
- La sesión contiene `nombre`, `username`, `rol`, `roles`, `superadmin` y `token`.
- Axios inyecta automáticamente el encabezado `Authorization: Bearer <token>`.
- Ante una respuesta 401, se limpia la sesión y se redirige a `/login.html`.

## 12.3 Orden de despliegue completo

```bash
# 1. Backend
cd /var/www/sgifep/backend
npm install --omit=dev
npm run migrate
npm run seed

# 2. Landing
cd /var/www/sgifep/landing
npm install
npm run build

# 3. Sistema
cd /var/www/sgifep/sistema/frontend
npm install
npm run build:deploy

# 4. Iniciar o reiniciar el backend
cd /var/www/sgifep/backend
pm2 start server.js --name sgifep
pm2 restart sgifep
pm2 save
```

## 12.4 Verificación posterior al despliegue

1. Abrir `https://dominio.com/` y comprobar que carga la landing.
2. Abrir `https://dominio.com/login.html` e iniciar sesión con `admin` / `admin123`.
3. Cambiar la contraseña del administrador.
4. Verificar que el panel `/usuarios/` carga correctamente.
5. Probar un módulo de solo lectura y uno de escritura con un usuario de rol limitado.
6. Confirmar que los reportes y la impresión funcionan.
7. Revisar los logs con `pm2 logs sgifep`.

---

# 13. BACKUP DE LA BASE DE DATOS

## 13.1 Objetivo

Garantizar la recuperación de la información ante fallos del servidor, errores humanos o incidentes de seguridad. En producción, el respaldo debe configurarse obligatoriamente como una tarea programada.

## 13.2 Respaldo manual

```bash
mkdir -p /var/backups/sgifep

mysqldump \
  --default-character-set=utf8mb4 \
  --single-transaction \
  --routines \
  --triggers \
  -u sgifep_user -p \
  sgifep_db > /var/backups/sgifep/sgifep_$(date +%F_%H-%M).sql
```

## 13.3 Restauración

```bash
mysql --default-character-set=utf8mb4 -u sgifep_user -p sgifep_db \
  < /var/backups/sgifep/sgifep_2026-01-01_02-00.sql
```

Antes de restaurar se recomienda detener la aplicación:

```bash
pm2 stop sgifep
# restaurar
pm2 start sgifep
```

## 13.4 Script de respaldo automático

Crear el archivo `/usr/local/bin/backup_sgifep.sh`:

```bash
#!/bin/bash

FECHA=$(date +%F_%H-%M)
DESTINO="/var/backups/sgifep"
ARCHIVO="$DESTINO/sgifep_$FECHA.sql"

mkdir -p "$DESTINO"

mysqldump \
  --default-character-set=utf8mb4 \
  --single-transaction \
  --routines \
  --triggers \
  -u sgifep_user -p'CONTRASENA_BD' \
  sgifep_db > "$ARCHIVO"

gzip "$ARCHIVO"

# Conservar únicamente los últimos 30 respaldos
find "$DESTINO" -name "sgifep_*.sql.gz" -mtime +30 -delete
```

Asignar permisos:

```bash
sudo chmod +x /usr/local/bin/backup_sgifep.sh
```

## 13.5 Programación con cron

Editar el crontab del usuario que ejecuta el respaldo:

```bash
sudo crontab -e
```

Agregar la tarea para ejecutarse todos los días a las 2:00 a. m.:

```cron
0 2 * * * /usr/local/bin/backup_sgifep.sh >> /var/log/sgifep-backup.log 2>&1
```

Verificar:

```bash
sudo crontab -l
ls -lh /var/backups/sgifep
tail -n 20 /var/log/sgifep-backup.log
```

## 13.6 Programación en Windows

Crear el archivo `C:\backups\backup_sgifep.bat`:

```bat
@echo off
set FECHA=%date:~-4%-%date:~3,2%-%date:~0,2%
set HORA=%time:~0,2%-%time:~3,2%
set ARCHIVO=C:\backups\sgifep_%FECHA%_%HORA%.sql

"C:\xampp\mysql\bin\mysqldump.exe" --default-character-set=utf8mb4 --single-transaction --routines --triggers -u root sgifep_db > "%ARCHIVO%"
```

Programar con el Programador de tareas de Windows:

1. Abrir el Programador de tareas.
2. Crear una tarea básica.
3. Frecuencia diaria, hora 02:00.
4. Acción: iniciar el programa `C:\backups\backup_sgifep.bat`.
5. Marcar la opción de ejecutar aunque el usuario no haya iniciado sesión.

## 13.7 Recomendaciones de respaldo

- Mantener copias locales y una copia externa (almacenamiento en la nube o servidor distinto).
- Verificar periódicamente que los respaldos se generan y que se pueden restaurar.
- Cifrar los respaldos si contienen datos sensibles.
- Conservar al menos 30 días de respaldos diarios y un respaldo mensual.
- Documentar la fecha, hora y ubicación de cada respaldo.

---

# 14. ANEXOS

## Anexo A. Credenciales del sistema

> Las siguientes credenciales son las generadas por el seed inicial. Deben cambiarse después del primer inicio de sesión en producción.

| Campo | Valor |
|---|---|
| Usuario administrador | `admin` |
| Contraseña inicial | `admin123` |
| Rol | `administrador` |
| URL de acceso | [Completar URL de login] |

Roles disponibles en el sistema:

| Rol | Alcance |
|---|---|
| `administrador` | Acceso total al sistema |
| `ventas` | Ventas y atención al cliente |
| `bodega` | Inventario y bodega |
| `caja` | Caja y cobros |
| `compras` | Compras y abastecimiento |
| `reparto` | Despacho y entregas |

> No incluir contraseñas reales de usuarios finales en este documento. Registrar únicamente el mecanismo de creación y el responsable de administrarlas.

## Anexo B. Credenciales de los servidores

> Completar con los datos reales del proveedor de nube. Este anexo debe manejarse como confidencial.

| Elemento | Valor |
|---|---|
| Proveedor de nube | [Completar: AWS, Azure, DigitalOcean, etc.] |
| Nombre del servidor | [Completar] |
| IP pública | [Completar] |
| Sistema operativo | Ubuntu Server 22.04 LTS |
| Usuario SSH | [Completar] |
| Método de acceso | [Llave SSH o contraseña] |
| Puerto SSH | [Completar, por defecto 22] |
| Dominio | [Completar] |
| Panel de control | [Completar, si aplica] |
| Responsable | [Completar] |

Credenciales de la base de datos:

| Elemento | Valor |
|---|---|
| Host | `127.0.0.1` |
| Puerto | `3306` |
| Base de datos | `sgifep_db` |
| Usuario | [Completar] |
| Contraseña | [Completar o indicar gestor de secretos] |

> Recomendación: no entregar contraseñas reales en el documento impreso. Usar un gestor de contraseñas y entregar el acceso por un canal seguro.

## Anexo C. Código fuente en producción

| Elemento | Valor |
|---|---|
| Repositorio | [Completar URL] |
| Rama de producción | `main` |
| Ruta en el servidor | `/var/www/sgifep` |
| Gestor de procesos | PM2, proceso `sgifep` |
| Puerto interno | `3000` |
| Proxy inverso | Nginx |
| Certificado SSL | Let's Encrypt / Certbot |

Comandos de actualización:

```bash
cd /var/www/sgifep
git pull origin main

cd backend
npm install --omit=dev
npm run migrate

cd ../landing
npm install
npm run build

cd ../sistema/frontend
npm install
npm run build:deploy

cd ../../backend
pm2 restart sgifep
```

## Anexo D. Script de base de datos

| Archivo | Uso |
|---|---|
| `database/scripts/002_usuarios_roles_departamentos.sql` | Esquema inicial de usuarios, roles y departamentos. Ejecutar una vez en base nueva. |
| `backend/migrations/003_superadmin.sql` a `033_despacho_pos.sql` | Migraciones incrementales del sistema. Ejecutar con `npm run migrate`. |
| `backend/seed.js` | Datos iniciales y usuario administrador. Ejecutar con `npm run seed`. |
| `backend/seed-compras.js` | Datos de demostración para el módulo de compras. |
| `database/scripts/025_corregir_textos.sql` | Corrección de textos dañados por codificación. |
| `database/scripts/schema.sql` | Archivo de referencia. No usar para levantar el entorno de producción. |

Ubicación de los respaldos:

```text
/var/backups/sgifep/
```

## Anexo E. Otros

### E.1 Comandos de operación frecuentes

| Acción | Comando |
|---|---|
| Iniciar backend en desarrollo | `cd backend && npm start` |
| Ejecutar migraciones | `cd backend && npm run migrate` |
| Ejecutar seed | `cd backend && npm run seed` |
| Compilar landing | `cd landing && npm run build` |
| Compilar y desplegar sistema | `cd sistema/frontend && npm run build:deploy` |
| Ver estado de PM2 | `pm2 status` |
| Ver logs del backend | `pm2 logs sgifep` |
| Reiniciar backend | `pm2 restart sgifep` |
| Respaldar base de datos | `/usr/local/bin/backup_sgifep.sh` |
| Renovar certificado SSL | `sudo certbot renew --dry-run` |

### E.2 Solución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| El backend no arranca | `JWT_SECRET` ausente en producción | Definir `JWT_SECRET` en `backend/.env` |
| Error de conexión a MySQL | Credenciales o servicio detenido | Verificar `.env` y `systemctl status mysql` |
| Login devuelve 500 | Migraciones o seed no ejecutados | Ejecutar `npm run migrate` y `npm run seed` |
| Tildes reemplazadas por `?` | Codificación incorrecta al importar SQL | Importar con `--default-character-set=utf8mb4` |
| El sistema muestra 404 al recargar | Nginx no redirige al backend | Verificar la configuración del proxy inverso |
| No cargan imágenes de productos | Permisos de `backend/storage/` | Asignar permisos de lectura al usuario de Node.js |
| La landing no aparece | No se compiló `landing/dist` | Ejecutar `cd landing && npm run build` |
| El frontend no conecta a la API | Proxy o URL base incorrecta | Verificar `VITE_API_BASE` y la configuración de Nginx |

### E.3 Lista de verificación para la entrega

- [ ] Base de datos creada, migrada y con seed ejecutado.
- [ ] Contraseña del usuario `admin` cambiada.
- [ ] `JWT_SECRET` definido con una clave segura.
- [ ] Variables de entorno configuradas en el servidor.
- [ ] Landing compilada y publicada en la raíz.
- [ ] Sistema compilado y publicado en `/usuarios/`.
- [ ] Backend ejecutándose con PM2 y arranque automático configurado.
- [ ] Nginx configurado como proxy inverso.
- [ ] HTTPS habilitado y renovación automática verificada.
- [ ] Cortafuegos activo con solo los puertos necesarios.
- [ ] Respaldo automático programado y probado.
- [ ] Credenciales de servidores y base de datos documentadas de forma segura.
- [ ] Repositorio y rama de producción identificados.
- [ ] Pruebas de login, módulos, reportes e impresión realizadas.
- [ ] Manual técnico revisado y sin datos pendientes.

### E.4 Mantenimiento recomendado

| Frecuencia | Actividad |
|---|---|
| Diaria | Verificar el respaldo automático y los logs de errores |
| Semanal | Revisar espacio en disco y estado de los servicios |
| Mensual | Aplicar actualizaciones de seguridad del sistema operativo |
| Mensual | Verificar la restauración de un respaldo en un entorno de prueba |
| Trimestral | Revisar usuarios activos, roles y permisos |
| Semestral | Actualizar dependencias npm y probar el despliegue completo |

---

**Fin del documento.**
