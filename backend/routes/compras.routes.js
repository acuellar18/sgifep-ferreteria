const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compra.controller');
const comentarioController = require('../controllers/compra-comentario.controller');
const archivoController = require('../controllers/compra-archivo.controller');
const { subirArchivoCompra } = require('../middlewares/upload-compra.middleware');
const { autenticar, requerirRoles } = require('../middlewares/auth.middleware');
const {
  ROL_ADMINISTRADOR,
  ROL_COMPRAS,
  ROL_BODEGA,
  ROL_CAJA
} = require('../config/auth');

const ROLES_CONSULTA = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_BODEGA, ROL_CAJA];
const ROLES_ESCRITURA = [ROL_ADMINISTRADOR, ROL_COMPRAS];
const ROLES_PAGOS = [ROL_ADMINISTRADOR, ROL_COMPRAS, ROL_CAJA];
const ROLES_ANULACION = [ROL_ADMINISTRADOR];

router.use(autenticar);

router.get('/impresion/lista', requerirRoles(ROLES_CONSULTA), compraController.impresionLista);
router.get('/resumenes', requerirRoles(ROLES_CONSULTA), compraController.resumenes);
router.get('/', requerirRoles(ROLES_CONSULTA), compraController.listar);
router.get('/:id/impresion', requerirRoles(ROLES_CONSULTA), compraController.impresion);
router.get('/:id/comentarios', requerirRoles(ROLES_CONSULTA), comentarioController.listar);
router.get('/:id/archivos', requerirRoles(ROLES_CONSULTA), archivoController.listar);
router.get('/:id/archivos/:archivoId', requerirRoles(ROLES_CONSULTA), archivoController.descargar);
router.get('/:id', requerirRoles(ROLES_CONSULTA), compraController.detalle);

router.post('/', requerirRoles(ROLES_ESCRITURA), compraController.crear);
router.put('/:id', requerirRoles(ROLES_ESCRITURA), compraController.actualizar);
router.post('/:id/anular', requerirRoles(ROLES_ANULACION), compraController.anular);
router.post('/:id/pagos', requerirRoles(ROLES_PAGOS), compraController.registrarPago);
router.delete('/:id/pagos/:pagoId', requerirRoles(ROLES_ANULACION), compraController.eliminarPago);
router.post('/:id/comentarios', requerirRoles(ROLES_ESCRITURA), comentarioController.crear);
router.post('/:id/archivos', requerirRoles(ROLES_ESCRITURA), subirArchivoCompra, archivoController.subir);
router.delete('/:id/archivos/:archivoId', requerirRoles(ROLES_ESCRITURA), archivoController.eliminar);

module.exports = router;
