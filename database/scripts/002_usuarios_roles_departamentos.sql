-- 002_usuarios_roles_departamentos.sql
-- Módulo de Usuarios, Roles y Departamentos (SGIFEP - Ferretería El Puente)
-- Ejecutar una sola vez contra la base de datos del backend (backend/.env -> DB_NAME).
-- No rompe la tabla `usuarios` existente: solo agrega columnas y tablas nuevas.

CREATE TABLE IF NOT EXISTS departamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    acceso_total TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extiende la tabla usuarios existente (una sola vez)
ALTER TABLE usuarios
    ADD COLUMN apellido VARCHAR(100) DEFAULT NULL AFTER nombre,
    ADD COLUMN codigo VARCHAR(30) DEFAULT NULL AFTER apellido,
    ADD COLUMN departamento_id INT DEFAULT NULL AFTER rol,
    ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER creado_en,
    ADD UNIQUE KEY uq_usuarios_codigo (codigo),
    ADD CONSTRAINT fk_usuarios_departamento FOREIGN KEY (departamento_id)
        REFERENCES departamentos(id) ON DELETE SET NULL;

-- Tabla puente: un usuario puede tener uno o varios roles
CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_ur_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Semillas de departamentos
INSERT INTO departamentos (id, nombre, descripcion, activo) VALUES
    (1, 'Ventas', 'Atención y venta al cliente', 1),
    (2, 'Bodega', 'Control de inventario y almacén', 1),
    (3, 'Caja', 'Cobros y facturación', 1),
    (4, 'Reparto', 'Despacho y entregas a domicilio', 1),
    (5, 'Compras', 'Compras y abastecimiento', 1),
    (6, 'Administración', 'Gestión administrativa del sistema', 1)
ON DUPLICATE KEY UPDATE id = id;

-- Semillas de roles
INSERT INTO roles (id, nombre, descripcion, acceso_total, activo) VALUES
    (1, 'administrador', 'Acceso total a todos los módulos del sistema', 1, 1),
    (2, 'ventas', 'Acceso al módulo de ventas', 0, 1),
    (3, 'bodega', 'Acceso al módulo de inventario', 0, 1),
    (4, 'caja', 'Acceso a facturación y cobros', 0, 1),
    (5, 'reparto', 'Acceso a despachos', 0, 1),
    (6, 'compras', 'Acceso a compras y abastecimiento', 0, 1)
ON DUPLICATE KEY UPDATE id = id;

-- Vincula el usuario admin existente al rol administrador
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT id, 1 FROM usuarios WHERE username = 'admin'
ON DUPLICATE KEY UPDATE rol_id = 1;