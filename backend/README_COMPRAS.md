# Módulo Compras: datos y reglas de base de datos

## Flujo recomendado

```powershell
cd backend
npm run migrate
npm run reiniciar-compras
npm run verificar-compras
npm run probar-permisos-compras
npm run probar-reportes-compras
```

- `npm run migrate` aplica `003` a `007` en orden. Las migraciones son idempotentes.
- `npm run reiniciar-compras` borra los datos demo de Compras, reinicia sus tablas y ejecuta el seed.
- `npm run verificar-compras` revisa totales, finanzas, stock, secuencias y triggers.
- `npm run probar-permisos-compras` prueba la matriz de permisos con tokens de cada rol.
- `npm run probar-reportes-compras` valida filtros, totales y consistencia de los reportes.

## Alcance del reinicio

Se eliminan y recrean:

- `proveedores`
- `productos`
- `producto_proveedor`
- `compras` y `detalle_compra`
- `ordenes_compra` y `detalle_orden_compra`
- `pagos_compra`
- `movimientos_inventario`
- `secuencias`
- `bitacora_auditoria`

Se conservan:

- `usuarios`
- `roles` y `usuario_roles`
- `departamentos`
- `categorias`

## Reglas implementadas

| Regla | Dónde vive |
| --- | --- |
| Total, IVA 12 % y saldo de la compra | `dtos/compra.dto.js` + triggers de pagos |
| `monto_pagado`, `saldo_pendiente`, `estado_pago` | `sp_recalcular_finanzas_compra` |
| Stock y costo promedio | trigger `trg_movimientos_after_insert` |
| Movimientos inmutables | triggers `trg_movimientos_before_update/delete` |
| Bloqueo de borrado de compras y pagos | triggers `before_delete` |
| Anulación lógica de pagos | `pagos_compra.estado` + motivo/usuario |
| Compra con pagos activos no se anula | `trg_compras_before_update` |
| Totales estimados de órdenes | `sp_recalcular_totales_orden` |
| Auditoría | triggers `after_*` sobre compras, pagos, órdenes y proveedores |
| Numeración correlativa | tabla `secuencias` (asignación transaccional) |

## Permisos

| Operación | Roles |
| --- | --- |
| Consultar compras, proveedores, productos y reportes | `administrador`, `compras`, `bodega`, `caja` |
| Crear compras | `administrador`, `compras` |
| Anular compras y pagos | `administrador` |
| Registrar pagos | `administrador`, `compras`, `caja` |
| Proveedores: crear, editar y cambiar estado | `administrador`, `compras` |
| Proveedores: eliminar | `administrador` |
| Productos: crear, editar y cambiar estado | `administrador`, `bodega` |
| Productos: eliminar | `administrador` |
| Consultar órdenes y stock bajo | `administrador`, `compras`, `bodega` |
| Crear, editar, enviar, cancelar y eliminar órdenes | `administrador`, `compras` |
| Recibir mercadería | `administrador`, `compras`, `bodega` |

`superadmin` conserva acceso total. `ventas` y `reparto` no acceden al módulo
Compras.

## Numeración

Los números `C-AAAA-000001` y `OC-AAAA-000001` se asignan desde la tabla
`secuencias` dentro de la misma transacción del documento. El año se toma de la
fecha del documento, no del reloj del servidor.

## Reportes

Los reportes viven en `/api/reportes-compras/*` y comparten los filtros
`proveedor`, `categoria`, `startDate` y `endDate`. El resumen y las compras por
mes cuentan compras recibidas (no líneas de detalle); el filtro de categoría usa
`EXISTS` para no duplicar documentos.

El frontend muestra resumen, compras por mes, top de proveedores, productos más
comprados, cuentas por pagar y variación de costo. Las exportaciones disponibles
son CSV, Excel y PDF.

## Inventario

`productos.stock_actual` no se actualiza directamente desde Node. Toda entrada o
salida debe insertar una fila en `movimientos_inventario`; el trigger aplica el
cambio y valida stock insuficiente.

Orígenes permitidos: `compra`, `anulacion_compra`, `ajuste_manual`,
`inventario_inicial`, `otro`.

## Pagos

La tabla antes llamada `pagos_proveedor` se renombra a `pagos_compra`.

- No se permite `DELETE` físico.
- La anulación usa `estado = 'anulado'`, `anulado_por`, `anulado_en` y
  `anulacion_motivo`.
- Solo los pagos con `estado = 'activo'` suman al saldo de la compra.

## Variables de sesión

- `@usuario_id`: usuario que ejecuta la operación; se guarda en la auditoría.
- `@sgifep_reset = 1`: solo lo usa el script de reinicio para omitir bloqueos
  de borrado y auditoría.

## Reversos manuales

Los reversos están en `backend/migrations/reversos/` y no se ejecutan con
`npm run migrate`. Aplicar primero `007` y luego `006` con un cliente MySQL que
soporte `DELIMITER`.
