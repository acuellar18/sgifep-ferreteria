const manejarAsync = require('../utils/async-handler');
const productoService = require('../services/producto.service');

function opcionesCostos(req) {
  return {
    incluirCostos: Boolean(req.permisos?.has('inventario.productos.ver_costos'))
  };
}

module.exports = {
  listar: manejarAsync(async (req, res) => {
    const { data, total, page, pageSize } = await productoService.listar(req.query, opcionesCostos(req));
    res.json({ success: true, data, total, page, pageSize });
  }),

  autocompletar: manejarAsync(async (req, res) => {
    const q = req.query.q || '';
    const limite = Math.min(Number(req.query.limite) || 10, 50);
    const { data } = await productoService.autocompletar(q, limite, opcionesCostos(req));
    res.json({ success: true, data });
  }),

  detalle: manejarAsync(async (req, res) => {
    const data = await productoService.detalle(req.params.id, opcionesCostos(req));
    res.json({ success: true, data });
  }),

  resumen: manejarAsync(async (req, res) => {
    const data = await productoService.resumen(opcionesCostos(req));
    res.json({ success: true, data });
  }),

  crear: manejarAsync(async (req, res) => {
    const id = await productoService.crear(req.body, req.usuario.id);
    res.status(201).json({ success: true, mensaje: 'Producto creado correctamente', data: { id } });
  }),

  actualizar: manejarAsync(async (req, res) => {
    await productoService.actualizar(req.params.id, req.body);
    res.json({ success: true, mensaje: 'Producto actualizado correctamente' });
  }),

  cambiarEstado: manejarAsync(async (req, res) => {
    const mensaje = await productoService.cambiarEstado(req.params.id, req.body.activo);
    res.json({ success: true, mensaje });
  }),

  eliminar: manejarAsync(async (req, res) => {
    await productoService.eliminar(req.params.id);
    res.json({ success: true, mensaje: 'Producto eliminado correctamente' });
  }),

  categorias: manejarAsync(async (req, res) => {
    const data = await productoService.obtenerCategorias();
    res.json({ success: true, data });
  })
};