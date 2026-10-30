import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { permisosCaja } from './utils/permisosCaja';
import { permisosCompras } from './utils/permisosCompras';
import { permisosFacturacion } from './utils/permisosFacturacion';
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
import ReporteVentasPage from './pages/Reportes/ReporteVentasPage';
import AuditoriaPage from './pages/Seguridad/AuditoriaPage';
import CategoriasPage from './pages/Inventario/CategoriasPage';
import ProductosPage from './pages/Inventario/ProductosPage';
import MovimientosPage from './pages/Inventario/MovimientosPage';
import ClientesPage from './pages/Facturacion/ClientesPage';
import FacturasPage from './pages/Facturacion/FacturasPage';
import NuevaFacturaPage from './pages/Facturacion/NuevaFacturaPage';
import CobrosPage from './pages/Facturacion/CobrosPage';
import ImpresionFacturaVentaPage from './pages/Facturacion/ImpresionFacturaVentaPage';
import CajaPage from './pages/Caja/CajaPage';
import PerfilPage from './pages/Perfil/PerfilPage';
import ModuloEnConstruccionPage from './pages/Modulos/ModuloEnConstruccionPage';
import ListadoDespachosPage from './pages/Despacho/ListadoDespachosPage';
import ReporteDespachosPage from './pages/Reportes/ReporteDespachosPage';
import RutasEntregasPage from './pages/Despacho/RutasEntregasPage';

// basename = '/usuarios' -> las rutas internas quedan bajo /usuarios/*.
// ToastProvider se monta una sola vez para conservar las notificaciones
// durante la navegación entre rutas.
function RequierePermiso({ permiso = 'consultarCompras', children }) {
  const permisos = {
    ...permisosCaja(),
    ...permisosCompras(),
    ...permisosInventario(),
    ...permisosFacturacion()
  };
  if (!permisos[permiso]) {
    const inicio = permisos.consultarCaja
      ? '/caja'
      : permisos.consultarCompras
        ? '/compras/facturas'
        : permisos.consultarInventario
          ? '/inventario/productos'
          : permisos.consultarFacturacion ? '/facturacion/facturas' : permisos.consultarCobros ? '/pos' : '/perfil';
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
          <Route
            path="/facturacion/facturas/:id/imprimir"
            element={<RequierePermiso permiso="consultarFacturas"><ImpresionFacturaVentaPage /></RequierePermiso>}
          />

          <Route element={<Layout />}>
            <Route path="/caja" element={<RequierePermiso permiso="consultarCaja"><CajaPage /></RequierePermiso>} />
            <Route path="/pos" element={<RequierePermiso permiso="consultarCobros"><CobrosPage /></RequierePermiso>} />
            <Route path="/perfil" element={<PerfilPage />} />

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
            <Route path="/inventario/movimientos" element={<RequierePermiso permiso="consultarMovimientos"><MovimientosPage /></RequierePermiso>} />
            <Route path="/inventario/reporte" element={<Navigate to="/reportes/inventario" replace />} />

            {/* Módulos aún en construcción, siempre dentro del layout compartido */}

            <Route path="/facturacion" element={<Navigate to="/facturacion/facturas" replace />} />
            <Route path="/facturacion/facturas" element={<RequierePermiso permiso="consultarFacturas"><FacturasPage /></RequierePermiso>} />
            <Route path="/facturacion/facturas/nueva" element={<RequierePermiso permiso="crearFacturas"><NuevaFacturaPage /></RequierePermiso>} />
            <Route path="/facturacion/clientes" element={<RequierePermiso permiso="consultarClientes"><ClientesPage /></RequierePermiso>} />
            <Route path="/facturacion/cobros" element={<Navigate to="/pos" replace />} />

            <Route path="/despacho" element={<ListadoDespachosPage />} />
            <Route path="/despacho/rutas-entregas" element={<RutasEntregasPage />} />
            <Route path="/reportes/despachos" element={<RequierePermiso permiso="consultarReporteDespachos"><ReporteDespachosPage /></RequierePermiso>} />
<Route path="/despacho/reporte" element={<Navigate to="/reportes/despachos" replace />} />

            <Route path="/reportes" element={<ModuloEnConstruccionPage titulo="Reportes" descripcion="El módulo de Reportes centralizará los indicadores generales del sistema." />} />
            <Route path="/reportes/ventas" element={<RequierePermiso permiso="consultarReporteFacturacion"><ReporteVentasPage /></RequierePermiso>} />
            <Route path="/reportes/compras" element={<RequierePermiso permiso="consultarReportes"><ReporteComprasPage /></RequierePermiso>} />
            <Route path="/reportes/inventario" element={<RequierePermiso permiso="consultarReporteInventario"><ReporteInventarioPage /></RequierePermiso>} />
            <Route path="/seguridad/auditoria" element={<RequierePermiso permiso="consultarAuditoria"><AuditoriaPage /></RequierePermiso>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
