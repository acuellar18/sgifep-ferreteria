import { Link } from 'react-router-dom';
import { permisosCompras } from '../../utils/permisosCompras';

const PASOS = [
  {
    numero: 1,
    titulo: 'Proveedores',
    detalle: 'Registra a quién le compras.',
    to: '/compras/proveedores'
  },
  {
    numero: 2,
    titulo: 'Registrar compra',
    detalle: 'Agrega productos, cantidades y costos.',
    to: '/compras/facturas/nueva',
    requiereCrear: true
  },
  {
    numero: 3,
    titulo: 'Facturas y pagos',
    detalle: 'Revisa saldos y registra pagos.',
    to: '/compras/facturas'
  }
];

export default function FlujoCompras({ pasoActivo = 1 }) {
  const { crearCompra } = permisosCompras();

  return (
    <nav className="flujo-compras" aria-label="Proceso de compras">
      <span className="flujo-compras-titulo">Proceso de compras</span>
      <ol className="flujo-compras-pasos">
        {PASOS.map((paso) => {
          const activo = paso.numero === pasoActivo;
          const bloqueado = paso.requiereCrear && !crearCompra;
          const contenido = (
            <>
              <span className="flujo-numero" aria-hidden="true">{paso.numero}</span>
              <span className="flujo-texto">
                <strong>{paso.titulo}</strong>
                <small>{bloqueado ? 'Solo administrador o compras.' : paso.detalle}</small>
              </span>
            </>
          );

          return (
            <li key={paso.numero} className="flujo-item">
              {bloqueado ? (
                <span className={`flujo-paso flujo-paso-bloqueado${activo ? ' flujo-paso-activo' : ''}`}>
                  {contenido}
                </span>
              ) : (
                <Link
                  to={paso.to}
                  className={`flujo-paso${activo ? ' flujo-paso-activo' : ''}`}
                  aria-current={activo ? 'step' : undefined}
                >
                  {contenido}
                </Link>
              )}
              {paso.numero < PASOS.length && <span className="flujo-flecha" aria-hidden="true">→</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
