import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/sidebar.css';
import './styles/reportes.css';
import './styles/inventario.css';
import './styles/barcode.css';
import './styles/facturacion.css';
import './styles/caja.css';
import './styles/pos.css';
import './styles/perfil.css';
import './styles/print.css';
import './styles/despacho.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);