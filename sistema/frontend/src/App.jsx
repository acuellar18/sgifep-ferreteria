import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import ReportePage from './pages/Usuarios/ReportePage';
import RolesPage from './pages/Roles/RolesPage';
import DepartamentosPage from './pages/Departamentos/DepartamentosPage';
import ProveedoresPage from './pages/Compras/ProveedoresPage';
import ComprasPage from './pages/Compras/ComprasPage';
import NuevaCompraPage from './pages/Compras/NuevaCompraPage';
import OrdenesCompraPage from './pages/Compras/OrdenesCompraPage';
import ReporteComprasPage from './pages/Compras/ReporteComprasPage';

// basename = '/usuarios' -> las rutas internas quedan bajo /usuarios/*
// (convertidas en los archivos servidos por Express desde backend/public/usuarios).
//
// ToastProvider se monta una sola vez aquí arriba: así una notificación
// disparada en cualquier página sobrevive a la navegación entre rutas y no
// hay que repetir el contenedor visual en cada módulo.
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
            {/* Módulo Compras */}
            <Route path="/compras/proveedores" element={<ProveedoresPage />} />
            <Route path="/compras/proveedores/:id" element={<ProveedoresPage />} />
            <Route path="/compras" element={<ComprasPage />} />
            <Route path="/compras/nueva" element={<NuevaCompraPage />} />
            <Route path="/compras/ordenes" element={<OrdenesCompraPage />} />
            <Route path="/compras/ordenes/nueva" element={<OrdenesCompraPage />} />
            <Route path="/compras/ordenes/:id" element={<OrdenesCompraPage />} />
            <Route path="/compras/reporte" element={<ReporteComprasPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}