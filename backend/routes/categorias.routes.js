const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');
const { autenticar, cargarPermisos, requerirPermiso } = require('../middlewares/auth.middleware');

router.use(autenticar, cargarPermisos);

router.get('/', requerirPermiso('inventario.categorias.ver'), categoriaController.listar);
router.get('/:id', requerirPermiso('inventario.categorias.ver'), categoriaController.detalle);

router.post('/', requerirPermiso('inventario.categorias.crear'), categoriaController.crear);
router.put('/:id', requerirPermiso('inventario.categorias.editar'), categoriaController.actualizar);
router.patch('/:id/estado', requerirPermiso('inventario.categorias.editar'), categoriaController.cambiarEstado);
router.delete('/:id', requerirPermiso('inventario.categorias.eliminar'), categoriaController.eliminar);

module.exports = router;
