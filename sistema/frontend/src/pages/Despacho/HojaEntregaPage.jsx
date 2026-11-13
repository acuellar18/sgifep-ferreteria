import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import PrintLayout from '../../components/print/PrintLayout';
import { datosNegocio } from '../../config/negocio';
import { formatearFecha, formatearMoneda, formatearNumero } from '../../utils/formatos';

const ETIQUETA_VEHICULO = {
  mototaxi: 'Mototaxi',
  motocicleta: 'Motocicleta',
  carro: 'Carro',
  pickup: 'Pickup / Camión'
};

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  entrega_parcial: 'Entrega parcial',
  no_entregado: 'No entregado',
  cancelado: 'Cancelado'
};

export default function HojaEntregaPage() {
  const { id } = useParams();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api.get(`/despachos/${id}`)
      .then((res) => { if (activo) setDatos(res.data); })
      .catch((err) => { if (activo) setError(err.message); });
    return () => { activo = false; };
  }, [id]);

  if (error) return <div className="print-error">{error}</div>;
  if (!datos) return <div className="print-error">Cargando hoja de entrega...</div>;

  const negocio = datosNegocio();
  const esContraEntrega = datos.forma_pago === 'contra_entrega';
  const montoACobrar = esContraEntrega ? Number(datos.factura_saldo_pendiente || 0) : 0;

  return (
    <PrintLayout
      empresa={negocio}
      titulo={`Hoja de entrega ${datos.codigo}`}
      subtitulo={datos.cliente_nombre}
      nombreArchivo={`hoja-entrega-${datos.codigo}.pdf`}
    >
      <div className="print-contenido-factura">
        <header className="print-encabezado">
          <div className="print-empresa">
            <div>
              <h1>{negocio.nombre}</h1>
              {negocio.nit && <p>NIT: {negocio.nit}</p>}
              {negocio.direccion && <p>{negocio.direccion}</p>}
              {negocio.telefono && <p>Tel: {negocio.telefono}</p>}
            </div>
          </div>
          <div className="print-documento-titulo">
            <span className="print-etiqueta">DESPACHO</span>
            <strong>Hoja de entrega</strong>
            <span className="print-numero">{datos.codigo}</span>
          </div>
        </header>

        <div className="print-datos-grid">
          <div>
            <h3>Cliente</h3>
            <p><strong>{datos.cliente_nombre || '—'}</strong></p>
            {datos.direccion_entrega && <p>Dirección: {datos.direccion_entrega}</p>}
            {datos.telefono_contacto && <p>Teléfono: {datos.telefono_contacto}</p>}
          </div>
          <div>
            <h3>Datos de la entrega</h3>
            <p><span>Fecha programada:</span> {datos.fecha_programada ? formatearFecha(datos.fecha_programada) : '—'}</p>
            <p><span>Estado:</span> {ETIQUETA_ESTADO[datos.estado] || datos.estado}</p>
            <p><span>Responsable:</span> {datos.responsable_nombre || '—'}</p>
            <p>
              <span>Vehículo:</span>{' '}
              {datos.tipo_vehiculo
                ? `${ETIQUETA_VEHICULO[datos.tipo_vehiculo] || datos.tipo_vehiculo}${datos.placa_vehiculo ? ` · ${datos.placa_vehiculo}` : ''}`
                : '—'}
            </p>
          </div>
        </div>

        <h3 className="print-subtitulo">Productos a entregar</h3>
        <table className="print-tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th className="num">Cantidad</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(datos.detalles || []).map((detalle) => (
              <tr key={detalle.id}>
                <td>{detalle.producto_codigo}</td>
                <td>{detalle.producto_nombre}</td>
                <td className="num">
                  {formatearNumero(detalle.cantidad, 3)} {detalle.unidad_medida}
                </td>
                <td className="num">{formatearMoneda(detalle.subtotal)}</td>
              </tr>
            ))}
            {(datos.detalles || []).length === 0 && (
              <tr><td colSpan="4">Sin detalle de productos.</td></tr>
            )}
          </tbody>
        </table>

        <div className="print-resumen-grid">
          <div className="print-pagos">
            <h3>Condiciones de entrega</h3>
            <table className="print-tabla print-tabla-compacta">
              <tbody>
                <tr>
                  <td>Pago</td>
                  <td>
                    {esContraEntrega ? 'Contra entrega' : (datos.forma_pago === 'credito' ? 'Crédito' : 'Contado')}
                  </td>
                </tr>
                <tr>
                  <td>Comprobante</td>
                  <td>{datos.factura_numero || '—'}</td>
                </tr>
                {esContraEntrega && (
                  <tr>
                    <td>Monto a cobrar</td>
                    <td className="num"><strong>{formatearMoneda(montoACobrar)}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="print-totales">
            {datos.costo_envio > 0 && (
              <div><span>Costo de envío</span><strong>{formatearMoneda(datos.costo_envio)}</strong></div>
            )}
            {esContraEntrega && (
              <div className="print-total-final"><span>Por cobrar</span><strong>{formatearMoneda(montoACobrar)}</strong></div>
            )}
          </div>
        </div>

        {datos.observaciones && (
          <div className="print-notas">
            <h3>Observaciones</h3>
            <p>{datos.observaciones}</p>
          </div>
        )}

        <div className="print-firmas">
          <div>
            Recibí conforme
            <br />
            <span>Nombre y firma de quien recibe</span>
          </div>
          <div>
            Entregado por
            <br />
            <span>{datos.responsable_nombre || '—'}</span>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
}
