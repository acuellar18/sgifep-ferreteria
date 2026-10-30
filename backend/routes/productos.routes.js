const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const productoImagenController = require('../controllers/producto-imagen.controller');
const { subirImagenProducto } = require('../middlewares/upload-producto.middleware');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/autocompletar', requerirPermiso('inventario.productos.ver'), productoController.autocompletar);
router.get('/categorias', requerirPermiso('inventario.productos.ver'), productoController.categorias);
router.get('/resumen', requerirPermiso('inventario.productos.ver'), productoController.resumen);
router.get('/', requerirPermiso('inventario.productos.ver'), productoController.listar);
router.get('/:id/imagen/miniatura', requerirPermiso('inventario.productos.ver'), productoImagenController.miniatura);
router.get('/:id/imagen', requerirPermiso('inventario.productos.ver'), productoImagenController.imagen);
router.get('/:id', requerirPermiso('inventario.productos.ver'), productoController.detalle);

router.post('/', requerirPermiso('inventario.productos.crear'), productoController.crear);
router.put('/:id', requerirPermiso('inventario.productos.editar'), productoController.actualizar);
router.patch('/:id/estado', requerirPermiso('inventario.productos.editar'), productoController.cambiarEstado);
router.post(
  '/:id/imagen',
  requerirPermiso('inventario.productos.editar'),
  subirImagenProducto,
  productoImagenController.subir
);
router.delete('/:id/imagen', requerirPermiso('inventario.productos.editar'), productoImagenController.eliminar);
router.delete('/:id', requerirPermiso('inventario.productos.eliminar'), productoController.eliminar);

module.exports = router;
