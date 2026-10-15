const express = require('express');
const router = express.Router();
const reporteCompraController = require('../controllers/reporte-compra.controller');
const { autenticar } = require('../middlewares/auth.middleware');

router.use(autenticar);

router.get('/resumen', reporteCompraController.resumen);
router.get('/compras-por-mes', reporteCompraController.comprasPorMes);
router.get('/top-proveedores', reporteCompraController.topProveedores);
router.get('/productos-mas-comprados', reporteCompraController.productosMasComprados);
router.get('/variacion-costo/:productoId', reporteCompraController.variacionCosto);
router.get('/cuentas-por-pagar', reporteCompraController.cuentasPorPagar);
router.get('/categorias', reporteCompraController.categorias);

module.exports = router;