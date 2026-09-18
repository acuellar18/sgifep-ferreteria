import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import ReportePage from './pages/Usuarios/ReportePage';
import RolesPage from './pages/Roles/RolesPage';
import DepartamentosPage from './pages/Departamentos/DepartamentosPage';

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}