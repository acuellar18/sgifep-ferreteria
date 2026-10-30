-- 022_departamentos_dedup_unicidad.sql
-- Consolida duplicados de departamentos que difieren solo por tildes,
-- mayúsculas o caracteres corruptos (p. ej. "Administracion",
-- "Administración" y "Administraci??n"), reasigna los usuarios al registro
-- ganador y agrega un índice UNIQUE sobre `departamentos.nombre`.
--
-- Idempotente: puede ejecutarse varias veces. Si no hay duplicados no borra
-- nada; si el índice ya existe no lo vuelve a crear.
--
-- Ejecutar SIEMPRE con el cliente en utf8mb4:
--   mysql --default-character-set=utf8mb4 -u root sgifep_db
--     < backend/migrations/022_departamentos_dedup_unicidad.sql

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Nota: la collation es utf8mb4_unicode_ci (insensible a tildes/mayúsculas),
-- por lo que `LIKE 'Administraci%n'` también encuentra la variante corrupta
-- con caracteres '?' intermedios. El patrón amplio cubre todas las variantes.
-- ---------------------------------------------------------------------------

-- 1) Administración -----------------------------------------------------------
SET @dept_admin_id := (
  SELECT MIN(id) FROM departamentos WHERE nombre LIKE 'Administraci%n'
);
UPDATE usuarios SET departamento_id = @dept_admin_id
WHERE departamento_id IN (
  SELECT id FROM departamentos
  WHERE nombre LIKE 'Administraci%n' AND id <> @dept_admin_id
);
DELETE FROM departamentos
WHERE nombre LIKE 'Administraci%n' AND id <> @dept_admin_id;
UPDATE departamentos
SET nombre = 'Administración', descripcion = 'Gestión administrativa del sistema'
WHERE id = @dept_admin_id;

-- 2) Secretaría ---------------------------------------------------------------
SET @dept_secretaria_id := (
  SELECT MIN(id) FROM departamentos WHERE nombre LIKE 'Secretar%a'
);
UPDATE usuarios SET departamento_id = @dept_secretaria_id
WHERE departamento_id IN (
  SELECT id FROM departamentos
  WHERE nombre LIKE 'Secretar%a' AND id <> @dept_secretaria_id
);
DELETE FROM departamentos
WHERE nombre LIKE 'Secretar%a' AND id <> @dept_secretaria_id;
UPDATE departamentos
SET nombre = 'Secretaría', descripcion = 'Secretaría y atención general'
WHERE id = @dept_secretaria_id;

-- 3) Catedrático --------------------------------------------------------------
SET @dept_catedratico_id := (
  SELECT MIN(id) FROM departamentos WHERE nombre LIKE 'Catedr%tico'
);
UPDATE usuarios SET departamento_id = @dept_catedratico_id
WHERE departamento_id IN (
  SELECT id FROM departamentos
  WHERE nombre LIKE 'Catedr%tico' AND id <> @dept_catedratico_id
);
DELETE FROM departamentos
WHERE nombre LIKE 'Catedr%tico' AND id <> @dept_catedratico_id;
UPDATE departamentos
SET nombre = 'Catedrático', descripcion = 'Área docente / catedráticos'
WHERE id = @dept_catedratico_id;

-- 4) Descripciones estándar del resto ----------------------------------------
UPDATE departamentos SET descripcion = 'Atención y venta al cliente'      WHERE nombre = 'Ventas';
UPDATE departamentos SET descripcion = 'Control de inventario y almacén'   WHERE nombre = 'Bodega';
UPDATE departamentos SET descripcion = 'Cobros y facturación'              WHERE nombre = 'Caja';
UPDATE departamentos SET descripcion = 'Despacho y entregas a domicilio'   WHERE nombre = 'Reparto';
UPDATE departamentos SET descripcion = 'Compras y abastecimiento'          WHERE nombre = 'Compras';

-- 5) Índice UNIQUE sobre el nombre (idempotente) ------------------------------
SET @existe_uq := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'departamentos'
    AND INDEX_NAME = 'uq_departamentos_nombre'
);
SET @sql_uq := IF(
  @existe_uq = 0,
  'ALTER TABLE departamentos ADD UNIQUE KEY uq_departamentos_nombre (nombre)',
  'SELECT 1'
);
PREPARE stmt_uq FROM @sql_uq;
EXECUTE stmt_uq;
DEALLOCATE PREPARE stmt_uq;

-- 6) Verificación -------------------------------------------------------------
SELECT id, nombre, descripcion, activo FROM departamentos ORDER BY nombre;
