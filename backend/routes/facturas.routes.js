const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/resumen', requerirPermiso('facturacion.facturas.ver'), facturaController.resumen);
router.get('/productos', requerirPermiso('facturacion.facturas.crear'), facturaController.productos);
router.get('/', requerirPermiso('facturacion.facturas.ver'), facturaController.listar);
router.get('/:id/impresion', requerirPermiso('facturacion.facturas.ver'), facturaController.impresion);
router.get('/:id', requerirPermiso('facturacion.facturas.ver'), facturaController.detalle);

router.post('/', requerirPermiso('facturacion.facturas.crear'), facturaController.crear);
router.post('/:id/anular', requerirPermiso('facturacion.facturas.anular'), facturaController.anular);

module.exports = router;
