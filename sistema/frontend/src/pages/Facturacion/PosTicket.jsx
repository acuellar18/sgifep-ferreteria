import { datosNegocio } from '../../config/negocio';
import {
  formatearFechaHora,
  formatearMoneda,
  formatearNumero,
  formatearNumeroComprobante
} from '../../utils/formatos';

const ETIQUETAS_METODO = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito'
};

export default function PosTicket({ venta, empresa }) {
  if (!venta) return null;

  const anulada = venta.estado === 'anulada';
  const negocio = datosNegocio(empresa);

  return (
    <div className={`pos-ticket-print${anulada ? ' pos-ticket-anulado' : ''}`}>
      {anulada && <div className="pos-ticket-marca">ANULADA</div>}

      <div className="pos-ticket-cabecera">
        <strong className="pos-ticket-negocio">{negocio.nombre}</strong>
        {negocio.direccion && <span>{negocio.direccion}</span>}
        {negocio.telefono && <span>Tel: {negocio.telefono}</span>}
      </div>

      <div className="pos-ticket-separador" />

      <div className="pos-ticket-datos">
        <div><span>Ticket</span><strong>{venta.numero}</strong></div>
        <div><span>Comprobante</span><strong>{formatearNumeroComprobante(venta.factura_numero)}</strong></div>
        <div><span>Fecha</span><strong>{formatearFechaHora(venta.creado_en)}</strong></div>
        <div><span>Cajero</span><strong>{venta.usuario_nombre || '—'}</strong></div>
        <div><span>Caja</span><strong>Caja {venta.caja_numero || venta.caja_id}</strong></div>
      </div>

      <div className="pos-ticket-separador" />

      <div className="pos-ticket-cliente">
        <span>Cliente</span>
        <strong>{venta.cliente_nombre || 'Consumidor Final'}</strong>
        <span>NIT/DPI: {venta.cliente_nit || 'CF'}</span>
        {venta.cliente_direccion && <span>{venta.cliente_direccion}</span>}
        {venta.despacho_direccion && <span>Entrega: {venta.despacho_direccion}</span>}
      </div>

      <div className="pos-ticket-separador" />

      <table className="pos-ticket-tabla">
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {(venta.detalles || []).map((detalle) => (
            <tr key={detalle.id}>
              <td>{formatearNumero(detalle.cantidad, detalle.tipo === 'servicio' ? 2 : 3)}</td>
              <td>
                {detalle.producto_nombre}
                {detalle.descuento > 0 && (
                  <small className="pos-ticket-descuento">
                    Desc. {formatearMoneda(detalle.descuento)}
                  </small>
                )}
              </td>
              <td>{formatearMoneda(detalle.precio_unitario)}</td>
              <td>{formatearMoneda(detalle.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pos-ticket-separador" />

      <div className="pos-ticket-totales">
        <div><span>Subtotal</span><span>{formatearMoneda(venta.subtotal)}</span></div>
        <div><span>IVA 12% (incluido)</span><span>{formatearMoneda(venta.iva)}</span></div>
        {venta.costo_envio > 0 && (
          <div><span>Envío</span><span>{formatearMoneda(venta.costo_envio)}</span></div>
        )}
        {venta.descuento > 0 && (
          <div><span>Descuento</span><span>-{formatearMoneda(venta.descuento)}</span></div>
        )}
        <div className="pos-ticket-total"><span>TOTAL</span><span>{formatearMoneda(venta.total)}</span></div>
      </div>

      <div className="pos-ticket-separador" />

      <div className="pos-ticket-pago">
        <div><span>Método de pago</span><strong>{ETIQUETAS_METODO[venta.metodo_pago] || venta.metodo_pago}</strong></div>
        {venta.metodo_pago === 'credito' ? (
          <div><span>Condiciones</span><strong>Cuenta por cobrar</strong></div>
        ) : (
          <>
            <div><span>Recibido</span><strong>{formatearMoneda(venta.monto_recibido)}</strong></div>
            <div><span>Cambio</span><strong>{formatearMoneda(venta.cambio)}</strong></div>
          </>
        )}
        {venta.referencia && (
          <div><span>Referencia</span><strong>{venta.referencia}</strong></div>
        )}
      </div>

      {venta.despacho_forma_pago === 'contra_entrega' && (
        <>
          <div className="pos-ticket-separador" />
          <div className="pos-ticket-contra-entrega">
            <strong>Pago contra entrega</strong>
            <span>{formatearMoneda(venta.total)} por cobrar al entregar</span>
          </div>
        </>
      )}

      {anulada && (
        <>
          <div className="pos-ticket-separador" />
          <div className="pos-ticket-anulacion">
            <strong>Venta anulada</strong>
            <span>{formatearFechaHora(venta.anulada_en)}</span>
            <span>Motivo: {venta.anulacion_motivo || '—'}</span>
          </div>
        </>
      )}

      <div className="pos-ticket-separador" />
      <p className="pos-ticket-gracias">¡Gracias por su compra!</p>
    </div>
  );
}
