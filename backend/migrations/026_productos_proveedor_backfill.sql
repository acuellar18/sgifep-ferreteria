-- 026_productos_proveedor_backfill.sql
-- Completa productos.proveedor_id para productos que se compraron antes de que
-- el módulo de Compras guardara el proveedor en el producto.
--
-- Regla: usa el proveedor de la compra más reciente (fecha e id) en la que
-- aparece el producto. Solo rellena productos con proveedor_id NULL, por lo
-- que es idempotente y no sobreescribe un proveedor ya asignado.
--
-- Ejecutar con: npm run migrate (en backend/).

UPDATE productos p
SET p.proveedor_id = (
    SELECT c.proveedor_id
    FROM detalle_compra dc
    INNER JOIN compras c ON c.id = dc.compra_id
    WHERE dc.producto_id = p.id
      AND c.proveedor_id IS NOT NULL
    ORDER BY c.fecha DESC, c.id DESC
    LIMIT 1
)
WHERE p.proveedor_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM detalle_compra dc2
    INNER JOIN compras c2 ON c2.id = dc2.compra_id
    WHERE dc2.producto_id = p.id
      AND c2.proveedor_id IS NOT NULL
  );
