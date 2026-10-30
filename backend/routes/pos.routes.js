const express = require('express');
const router = express.Router();
const posController = require('../controllers/pos.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/contexto', requerirPermiso('facturacion.cobros.ver'), posController.contexto);
router.get('/productos/codigo', requerirPermiso('facturacion.cobros.ver'), posController.productoPorCodigo);
router.get('/productos', requerirPermiso('facturacion.cobros.ver'), posController.productos);
router.get('/clientes', requerirPermiso('facturacion.cobros.ver'), posController.clientePorNit);
router.get('/resumen', requerirPermiso('facturacion.cobros.ver'), posController.resumen);
router.get('/cuentas-por-cobrar', requerirPermiso('facturacion.cobros.ver'), posController.cuentasPorCobrar);
router.get('/cuentas-por-cobrar/:id', requerirPermiso('facturacion.cobros.ver'), posController.cuenta);
router.get('/ventas', requerirPermiso('facturacion.cobros.ver'), posController.listar);
router.get('/ventas/:id', requerirPermiso('facturacion.cobros.ver'), posController.detalle);

router.post('/ventas', requerirPermiso('facturacion.cobros.registrar'), posController.crear);
router.post('/ventas/:id/anular', requerirPermiso('facturacion.cobros.anular'), posController.anular);
router.post('/ventas/:id/devoluciones', requerirPermiso('facturacion.cobros.devolver'), posController.devolucion);
router.post('/cuentas-por-cobrar/:id/pagos', requerirPermiso('facturacion.cobros.registrar'), posController.pagoCuenta);

module.exports = router;
