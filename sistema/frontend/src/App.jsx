import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { permisosCompras } from './utils/permisosCompras';
import { permisosInventario } from './utils/permisosInventario';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import ReportePage from './pages/Usuarios/ReportePage';
import RolesPage from './pages/Roles/RolesPage';
import DepartamentosPage from './pages/Departamentos/DepartamentosPage';
import ProveedoresPage from './pages/Compras/ProveedoresPage';
import ComprasPage from './pages/Compras/ComprasPage';
import NuevaCompraPage from './pages/Compras/NuevaCompraPage';
import ImpresionFacturaPage from './pages/Compras/ImpresionFacturaPage';
import ImpresionListaComprasPage from './pages/Compras/ImpresionListaComprasPage';
import ReporteComprasPage from './pages/Compras/ReporteComprasPage';
import ReporteInventarioPage from './pages/Inventario/ReporteInventarioPage';
import CategoriasPage from './pages/Inventario/CategoriasPage';
import ProductosPage from './pages/Inventario/ProductosPage';
import ModuloEnConstruccionPage from './pages/Modulos/ModuloEnConstruccionPage';

// basename = '/usuarios' -> las rutas internas quedan bajo /usuarios/*.
// ToastProvider se monta una sola vez para conservar las notificaciones
// durante la navegación entre rutas.
function RequierePermiso({ permiso = 'consultarCompras', children }) {
  const permisos = { ...permisosCompras(), ...permisosInventario() };
  if (!permisos[permiso]) {
    const inicio = permisos.consultarCompras
      ? '/compras/facturas'
      : permisos.consultarInventario ? '/inventario/productos' : '/';
    return <Navigate to={inicio} replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename="/usuarios">
        <Routes>
          <Route
            path="/compras/facturas/imprimir"
            element={<RequierePermiso><ImpresionListaComprasPage /></RequierePermiso>}
          />
          <Route
            path="/compras/facturas/:id/imprimir"
            element={<RequierePermiso><ImpresionFacturaPage /></RequierePermiso>}
          />

          <Route element={<Layout />}>
            <Route path="/" element={<UsuariosPage />} />
            <Route path="/reporte" element={<ReportePage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/departamentos" element={<DepartamentosPage />} />

            {/* Módulo Compras: solo Proveedores y Facturas de proveedor.
                Las páginas y endpoints de Órdenes de Compra se conservan, pero
                quedan fuera del menú y del router (módulo inactivo). */}
            <Route path="/compras/proveedores" element={<RequierePermiso><ProveedoresPage /></RequierePermiso>} />
            <Route path="/compras/facturas" element={<RequierePermiso><ComprasPage /></RequierePermiso>} />
            <Route path="/compras/facturas/nueva" element={<RequierePermiso permiso="crearCompra"><NuevaCompraPage /></RequierePermiso>} />
            <Route path="/compras" element={<Navigate to="/compras/facturas" replace />} />
            <Route path="/compras/*" element={<Navigate to="/compras/facturas" replace />} />

            <Route path="/inventario" element={<Navigate to="/inventario/productos" replace />} />
            <Route path="/inventario/productos" element={<RequierePermiso permiso="consultarProductos"><ProductosPage /></RequierePermiso>} />
            <Route path="/inventario/categorias" element={<RequierePermiso permiso="consultarCategorias"><CategoriasPage /></RequierePermiso>} />
            <Route path="/inventario/movimientos" element={<RequierePermiso permiso="consultarInventario"><ModuloEnConstruccionPage titulo="Inventario - Movimientos" descripcion="El control de entradas y salidas estará disponible en una fase posterior del módulo." /></RequierePermiso>} />
            <Route path="/inventario/reporte" element={<Navigate to="/reportes/inventario" replace />} />

            {/* Módulos aún en construcción, siempre dentro del layout compartido */}

            <Route path="/facturacion" element={<ModuloEnConstruccionPage titulo="Facturación" descripcion="El módulo de Facturación permitirá gestionar facturas, clientes y cobros." />} />
            <Route path="/facturacion/clientes" element={<ModuloEnConstruccionPage titulo="Facturación - Clientes" descripcion="La gestión de clientes de facturación estará disponible próximamente." />} />
            <Route path="/facturacion/cobros" element={<ModuloEnConstruccionPage titulo="Facturación - Cobros" descripcion="El registro y control de cobros estará disponible próximamente." />} />
            <Route path="/facturacion/reporte" element={<ModuloEnConstruccionPage titulo="Facturación - Reporte" descripcion="El reporte de facturación estará disponible próximamente." />} />

            <Route path="/despacho" element={<ModuloEnConstruccionPage titulo="Despacho" descripcion="El módulo de Despacho permitirá gestionar despachos, rutas y entregas." />} />
            <Route path="/despacho/rutas-entregas" element={<ModuloEnConstruccionPage titulo="Despacho - Rutas y Entregas" descripcion="La planificación de rutas y entregas estará disponible próximamente." />} />
            <Route path="/despacho/reporte" element={<ModuloEnConstruccionPage titulo="Despacho - Reporte" descripcion="El reporte de despachos estará disponible próximamente." />} />

            <Route path="/reportes" element={<ModuloEnConstruccionPage titulo="Reportes" descripcion="El módulo de Reportes centralizará los indicadores generales del sistema." />} />
            <Route path="/reportes/ventas" element={<ModuloEnConstruccionPage titulo="Reportes - Ventas" descripcion="El reporte de ventas estará disponible próximamente." />} />
            <Route path="/reportes/compras" element={<RequierePermiso permiso="consultarReportes"><ReporteComprasPage /></RequierePermiso>} />
            <Route path="/reportes/inventario" element={<RequierePermiso permiso="consultarReporteInventario"><ReporteInventarioPage /></RequierePermiso>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
