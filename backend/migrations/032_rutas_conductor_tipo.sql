-- 032_rutas_conductor_tipo.sql
-- Rutas de entrega: registrar el nombre del conductor (texto libre) y el tipo
-- de vehículo (motocicleta / mototaxi / carro) en lugar de depender solo de los
-- catálogos de conductores/vehículos.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

SET @existe_conductor_nombre := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'rutas'
      AND COLUMN_NAME = 'conductor_nombre'
);
SET @sql := IF(
    @existe_conductor_nombre = 0,
    'ALTER TABLE rutas ADD COLUMN conductor_nombre VARCHAR(150) DEFAULT NULL AFTER conductor_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe_tipo_vehiculo := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'rutas'
      AND COLUMN_NAME = 'tipo_vehiculo'
);
SET @sql := IF(
    @existe_tipo_vehiculo = 0,
    'ALTER TABLE rutas ADD COLUMN tipo_vehiculo ENUM(''motocicleta'',''mototaxi'',''carro'') DEFAULT NULL AFTER vehiculo_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
