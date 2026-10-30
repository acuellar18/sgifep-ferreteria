-- Agrega los campos presentacion y ubicacion a productos.
-- Idempotente: comprueba information_schema antes de alterar, por lo que puede
-- ejecutarse varias veces con `npm run migrate` en MySQL 8 o MariaDB.
--
-- Reverso manual:
--   ALTER TABLE productos DROP COLUMN ubicacion, DROP COLUMN presentacion;

DELIMITER $$

DROP PROCEDURE IF EXISTS agregar_campos_producto$$

CREATE PROCEDURE agregar_campos_producto()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'productos'
          AND COLUMN_NAME = 'presentacion'
    ) THEN
        ALTER TABLE productos ADD COLUMN presentacion VARCHAR(100) NULL AFTER tipo;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'productos'
          AND COLUMN_NAME = 'ubicacion'
    ) THEN
        ALTER TABLE productos ADD COLUMN ubicacion VARCHAR(100) NULL AFTER presentacion;
    END IF;
END$$

DELIMITER ;

CALL agregar_campos_producto();

DROP PROCEDURE IF EXISTS agregar_campos_producto;
