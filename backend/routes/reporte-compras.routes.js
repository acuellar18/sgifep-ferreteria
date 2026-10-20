const express = require('express');
const router = express.Router();
const reporteCompraController = require('../controllers/reporte-compra.controller');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const {
  ROL_ADMINISTRADOR,
  ROL_COMPRAS,
  ROL_BODEGA,
  ROL_CAJA
} = require('../config/auth');

const ROLES_CONSULTA = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_BODEGA, ROL_CAJA];

router.use(autenticar);

router.get('/resumen', requerirRoles(ROLES_CONSULTA), reporteCompraController.resumen);
router.get('/compras-por-mes', requerirRoles(ROLES_CONSULTA), reporteCompraController.comprasPorMes);
router.get('/top-proveedores', requerirRoles(ROLES_CONSULTA), reporteCompraController.topProveedores);
router.get('/productos-mas-comprados', requerirRoles(ROLES_CONSULTA), reporteCompraController.productosMasComprados);
router.get('/variacion-costo/:productoId', requerirRoles(ROLES_CONSULTA), reporteCompraController.variacionCosto);
router.get('/cuentas-por-pagar', requerirRoles(ROLES_CONSULTA), reporteCompraController.cuentasPorPagar);
router.get('/categorias', requerirRoles(ROLES_CONSULTA), reporteCompraController.categorias);

module.exports = router;
