import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { permisosCompras } from './utils/permisosCompras';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import ReportePage from './pages/Usuarios/ReportePage';
import RolesPage from './pages/Roles/RolesPage';
import DepartamentosPage from './pages/Departamentos/DepartamentosPage';
import ProveedoresPage from './pages/Compras/ProveedoresPage';
import ComprasPage from './pages/Compras/ComprasPage';
import ReporteComprasPage from './pages/Compras/ReporteComprasPage';
import ModuloEnConstruccionPage from './pages/Modulos/ModuloEnConstruccionPage';

// basename = '/usuarios' -> las rutas internas quedan bajo /usuarios/*.
// ToastProvider se monta una sola vez para conservar las notificaciones
// durante la navegación entre rutas.
function RequierePermiso({ permiso = 'consultarCompras', children }) {
  const permisos = permisosCompras();
  if (!permisos[permiso]) {
    return <Navigate to={permisos.consultarCompras ? '/compras/facturas' : '/'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename="/usuarios">
        <Routes>
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
            <Route path="/compras" element={<Navigate to="/compras/facturas" replace />} />
            <Route path="/compras/*" element={<Navigate to="/compras/facturas" replace />} />

            {/* Módulos aún en construcción, siempre dentro del layout compartido */}
            <Route path="/inventario" element={<ModuloEnConstruccionPage titulo="Inventario" descripcion="El módulo de Inventario permitirá administrar productos, categorías, movimientos y reportes de existencias." />} />
            <Route path="/inventario/categorias" element={<ModuloEnConstruccionPage titulo="Inventario - Categorías" descripcion="La gestión de categorías de inventario estará disponible próximamente." />} />
            <Route path="/inventario/movimientos" element={<ModuloEnConstruccionPage titulo="Inventario - Movimientos" descripcion="El control de entradas y salidas de inventario estará disponible próximamente." />} />
            <Route path="/inventario/reporte" element={<ModuloEnConstruccionPage titulo="Inventario - Reporte" descripcion="El reporte de inventario estará disponible próximamente." />} />

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
            <Route path="/reportes/inventario" element={<ModuloEnConstruccionPage titulo="Reportes - Inventario" descripcion="El reporte general de inventario estará disponible próximamente." />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
