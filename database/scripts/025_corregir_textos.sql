-- 025_corregir_textos.sql
-- Normaliza la base de datos a utf8mb4 y repara textos dañados por importaciones
-- realizadas con una conexión latin1/ASCII (por ejemplo "m??dulos").
--
-- Respaldo previo obligatorio (ejecutar antes de este script):
--   "C:\xampp\mysql\bin\mysqldump.exe" --default-character-set=utf8mb4 -u root -p ^
--     --single-transaction --routines --triggers sgifep_db > respaldo_sgifep_db.sql
--
-- Ejecución:
--   "C:\xampp\mysql\bin\mysql.exe" --default-character-set=utf8mb4 -u root -p sgifep_db ^
--     < database\scripts\025_corregir_textos.sql
--
-- El script es idempotente: puede ejecutarse varias veces sin duplicar datos.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- 1) Respaldo de las tablas que se modifican
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _bak_roles_utf8mb4 AS SELECT * FROM roles;
CREATE TABLE IF NOT EXISTS _bak_departamentos_utf8mb4 AS SELECT * FROM departamentos;
CREATE TABLE IF NOT EXISTS _bak_usuarios_utf8mb4 AS SELECT * FROM usuarios;
CREATE TABLE IF NOT EXISTS _bak_pagos_compra_utf8mb4 AS SELECT * FROM pagos_compra;
CREATE TABLE IF NOT EXISTS _bak_bitacora_auditoria_utf8mb4 AS SELECT * FROM bitacora_auditoria;

-- ---------------------------------------------------------------------------
-- 2) Conversión de la base de datos y de todas sus tablas a utf8mb4
-- ---------------------------------------------------------------------------
-- MariaDB no permite ALTER DATABASE mediante PREPARE; ajusta el nombre si tu
-- DB_NAME es distinto de sgifep_db.
ALTER DATABASE sgifep_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS _convertir_tablas_utf8mb4;
DELIMITER $$
CREATE PROCEDURE _convertir_tablas_utf8mb4()
BEGIN
  DECLARE fin INT DEFAULT 0;
  DECLARE tabla VARCHAR(255);
  DECLARE cur CURSOR FOR
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
      AND LEFT(TABLE_NAME, 5) <> '_bak_';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET fin = 1;

  OPEN cur;
  bucle: LOOP
    FETCH cur INTO tabla;
    IF fin = 1 THEN
      LEAVE bucle;
    END IF;
    SET @sql_tabla := CONCAT(
      'ALTER TABLE `', tabla,
      '` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    PREPARE stmt_tabla FROM @sql_tabla;
    EXECUTE stmt_tabla;
    DEALLOCATE PREPARE stmt_tabla;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

CALL _convertir_tablas_utf8mb4();
DROP PROCEDURE IF EXISTS _convertir_tablas_utf8mb4;

-- ---------------------------------------------------------------------------
-- 3) Reparación de roles
-- ---------------------------------------------------------------------------
UPDATE roles SET descripcion = 'Acceso total a todos los módulos del sistema'
WHERE nombre = 'administrador';
UPDATE roles SET descripcion = 'Acceso al módulo de ventas'
WHERE nombre = 'ventas';
UPDATE roles SET descripcion = 'Acceso al módulo de inventario'
WHERE nombre = 'bodega';
UPDATE roles SET descripcion = 'Acceso a facturación y cobros'
WHERE nombre = 'caja';
UPDATE roles SET descripcion = 'Acceso a despachos'
WHERE nombre = 'reparto';
UPDATE roles SET descripcion = 'Acceso a compras y abastecimiento'
WHERE nombre = 'compras';

-- ---------------------------------------------------------------------------
-- 3.1) Textos generados por versiones anteriores del backend
-- ---------------------------------------------------------------------------
UPDATE pagos_compra
SET referencia = 'Pago automático contado'
WHERE referencia = 'Pago automtico contado';

UPDATE bitacora_auditoria
SET datos_nuevos = REPLACE(datos_nuevos, 'Pago automtico contado', 'Pago automático contado')
WHERE datos_nuevos LIKE '%Pago automtico contado%';

UPDATE bitacora_auditoria
SET datos_anteriores = REPLACE(datos_anteriores, 'Pago automtico contado', 'Pago automático contado')
WHERE datos_anteriores LIKE '%Pago automtico contado%';

-- ---------------------------------------------------------------------------
-- 4) Reparación de departamentos (incluye duplicados sin tilde)
-- ---------------------------------------------------------------------------
-- 4.1 Administración: consolidar variantes en un único registro.
SET @dept_admin_id := (
  SELECT MIN(id) FROM departamentos
  WHERE nombre IN ('Administración', 'Administracion', 'Administraci?n', 'Administraci??n')
);
UPDATE usuarios SET departamento_id = @dept_admin_id
WHERE departamento_id IN (
  SELECT id FROM departamentos
  WHERE nombre IN ('Administración', 'Administracion', 'Administraci?n', 'Administraci??n')
    AND id <> @dept_admin_id
);
DELETE FROM departamentos
WHERE nombre IN ('Administración', 'Administracion', 'Administraci?n', 'Administraci??n')
  AND id <> @dept_admin_id;
UPDATE departamentos
SET nombre = 'Administración', descripcion = 'Gestión administrativa del sistema'
WHERE id = @dept_admin_id;

-- 4.2 Secretaría.
SET @dept_secretaria_id := (
  SELECT MIN(id) FROM departamentos WHERE nombre IN ('Secretaría', 'Secretaria')
);
UPDATE usuarios SET departamento_id = @dept_secretaria_id
WHERE departamento_id IN (
  SELECT id FROM departamentos
  WHERE nombre IN ('Secretaría', 'Secretaria') AND id <> @dept_secretaria_id
);
DELETE FROM departamentos
WHERE nombre IN ('Secretaría', 'Secretaria') AND id <> @dept_secretaria_id;
UPDATE departamentos
SET nombre = 'Secretaría', descripcion = 'Secretaría y atención general'
WHERE id = @dept_secretaria_id;

-- 4.3 Catedrático.
SET @dept_catedratico_id := (
  SELECT MIN(id) FROM departamentos WHERE nombre IN ('Catedrático', 'Catedratico')
);
UPDATE usuarios SET departamento_id = @dept_catedratico_id
WHERE departamento_id IN (
  SELECT id FROM departamentos
  WHERE nombre IN ('Catedrático', 'Catedratico') AND id <> @dept_catedratico_id
);
DELETE FROM departamentos
WHERE nombre IN ('Catedrático', 'Catedratico') AND id <> @dept_catedratico_id;
UPDATE departamentos
SET nombre = 'Catedrático', descripcion = 'Área docente / catedráticos'
WHERE id = @dept_catedratico_id;

-- 4.4 Descripciones del resto de departamentos.
UPDATE departamentos SET descripcion = 'Atención y venta al cliente'
WHERE nombre = 'Ventas';
UPDATE departamentos SET descripcion = 'Control de inventario y almacén'
WHERE nombre = 'Bodega';
UPDATE departamentos SET descripcion = 'Cobros y facturación'
WHERE nombre = 'Caja';
UPDATE departamentos SET descripcion = 'Despacho y entregas a domicilio'
WHERE nombre = 'Reparto';
UPDATE departamentos SET descripcion = 'Compras y abastecimiento'
WHERE nombre = 'Compras';

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- 5) Verificación
-- ---------------------------------------------------------------------------
SELECT id, nombre, descripcion FROM roles ORDER BY id;
SELECT id, nombre, descripcion FROM departamentos ORDER BY id;
