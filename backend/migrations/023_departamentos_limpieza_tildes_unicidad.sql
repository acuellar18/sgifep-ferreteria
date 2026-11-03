-- 023_departamentos_limpieza_tildes_unicidad.sql
-- Limpieza definitiva de la tabla `departamentos`:
--  1) Consolida duplicados que difieren solo por tildes/mayúsculas o que
--     contienen caracteres corruptos (p. ej. "Administraci??n"), reasignando
--     los usuarios al registro ganador (el de menor id) antes de borrar el resto.
--  2) Fija los nombres canónicos con sus tildes correctas: "Administración",
--     "Secretaría" y "Catedrático".
--  3) Garantiza un índice UNIQUE (utf8mb4_unicode_ci es insensible a
--     tildes/mayúsculas, por lo que la base rechaza también duplicados
--     escritos de forma distinta).
--
-- Idempotente: puede ejecutarse varias veces sin efectos secundarios.
-- EJECUTAR SIEMPRE con cliente en utf8mb4. El runner `npm run migrate` ya
-- conecta con charset utf8mb4_unicode_ci.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1) Administración ----------------------------------------------------------
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2) Secretaría --------------------------------------------------------------
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3) Catedrático -------------------------------------------------------------
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4) Descripciones estándar del resto de catálogo ----------------------------
-- ---------------------------------------------------------------------------
UPDATE departamentos SET descripcion = 'Atención y venta al cliente'      WHERE nombre = 'Ventas';
UPDATE departamentos SET descripcion = 'Control de inventario y almacén'   WHERE nombre = 'Bodega';
UPDATE departamentos SET descripcion = 'Cobros y facturación'              WHERE nombre = 'Caja';
UPDATE departamentos SET descripcion = 'Despacho y entregas a domicilio'   WHERE nombre = 'Reparto';
UPDATE departamentos SET descripcion = 'Compras y abastecimiento'          WHERE nombre = 'Compras';

-- ---------------------------------------------------------------------------
-- 5) Índice UNIQUE sobre el nombre (idempotente) -----------------------------
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6) Verificación ------------------------------------------------------------
-- ---------------------------------------------------------------------------
SELECT id, nombre, descripcion, activo FROM departamentos ORDER BY nombre;