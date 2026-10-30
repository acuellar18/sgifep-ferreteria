import Modal from '../../components/Modal';
import { rutaImpresionFacturaVenta } from '../../utils/rutasFacturacion';
import {
  etiquetaEstado,
  etiquetaEstadoPago,
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
  formatearNumero
} from '../../utils/formatos';

function Dato({ etiqueta, children, completo = false }) {
  return (
    <div className={`facturacion-detalle-dato${completo ? ' facturacion-detalle-completo' : ''}`}>
      <span>{etiqueta}</span>
      <strong>{children || '—'}</strong>
    </div>
  );
}

function ChipEstado({ estado }) {
  return (
    <span className={`chip ${estado === 'anulada' ? 'chip-peligro' : 'chip-ok'}`}>
      {etiquetaEstado(estado)}
    </span>
  );
}

function ChipEstadoPago({ estado, facturaAnulada }) {
  if (facturaAnulada) return <span className="chip chip-peligro">Sin cobro</span>;
  const clase = estado === 'pagada' ? 'chip-ok' : estado === 'parcial' ? 'chip-rol' : 'chip-peligro';
  return <span className={`chip ${clase}`}>{etiquetaEstadoPago(estado)}</span>;
}

export default function FacturaDetalleModal({ factura, onCerrar, onAnular }) {
  if (!factura) return null;

  const anulada = factura.estado === 'anulada';
  const detalles = Array.isArray(factura.detalles) ? factura.detalles : [];

  return (
    <Modal abierto titulo="Detalle de factura" onCerrar={onCerrar} ancho="900px">
      <div className="facturacion-detalle-cabecera">
        <div>
          <div className="facturacion-detalle-titulo">
            <h3>{factura.numero}</h3>
            <ChipEstado estado={factura.estado} />
            <ChipEstadoPago estado={factura.estado_pago} facturaAnulada={anulada} />
          </div>
          <p className="reporte-detalle">
            {factura.cliente_nombre} · NIT {factura.cliente_nit}
          </p>
        </div>
        <div className="facturacion-detalle-saldo">
          <span>Total factura</span>
          <strong>{formatearMoneda(factura.total)}</strong>
          <small>
            {anulada
              ? 'Factura anulada'
              : factura.saldo_pendiente > 0
                ? `Saldo ${formatearMoneda(factura.saldo_pendiente)}`
                : 'Sin saldo pendiente'}
          </small>
        </div>
      </div>

      <div className="facturacion-detalle-grid">
        <Dato etiqueta="Fecha de emisión">{formatearFecha(factura.fecha)}</Dato>
        <Dato etiqueta="Condición">
          {factura.condicion === 'credito' ? 'Crédito' : 'Contado'}
        </Dato>
        <Dato etiqueta="Vencimiento">{formatearFecha(factura.fecha_vencimiento)}</Dato>
        <Dato etiqueta="Registrada por">{factura.usuario_nombre}</Dato>
        <Dato etiqueta="Teléfono">{factura.cliente_telefono}</Dato>
        <Dato etiqueta="Correo">{factura.cliente_correo}</Dato>
        <Dato etiqueta="Dirección" completo>{factura.cliente_direccion}</Dato>
      </div>

      <div className="facturacion-historial">
        <div className="facturacion-historial-encabezado">
          <h4>Productos y servicios</h4>
          <span>{detalles.length} línea(s)</span>
        </div>
        <div className="tabla-wrapper">
          <table className="tabla facturacion-tabla-detalle">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th className="facturacion-col-num">Cantidad</th>
                <th className="facturacion-col-num">Precio</th>
                <th className="facturacion-col-num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle) => (
                <tr key={detalle.id}>
                  <td>{detalle.producto_codigo}</td>
                  <td>
                    <strong>{detalle.producto_nombre}</strong>
                    {detalle.tipo === 'servicio' && (
                      <span className="chip chip-rol facturacion-chip-servicio">Servicio</span>
                    )}
                  </td>
                  <td className="facturacion-col-num">
                    {formatearNumero(detalle.cantidad, 3)} {detalle.unidad_medida}
                  </td>
                  <td className="facturacion-col-num">{formatearMoneda(detalle.precio_unitario)}</td>
                  <td className="facturacion-col-num">{formatearMoneda(detalle.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="facturacion-totales">
          <div><span>Subtotal</span><strong>{formatearMoneda(factura.subtotal)}</strong></div>
          <div><span>IVA (12%)</span><strong>{formatearMoneda(factura.iva)}</strong></div>
          <div className="facturacion-total-final"><span>Total</span><strong>{formatearMoneda(factura.total)}</strong></div>
          <div><span>Pagado</span><strong>{formatearMoneda(factura.monto_pagado)}</strong></div>
          <div><span>Saldo pendiente</span><strong>{formatearMoneda(factura.saldo_pendiente)}</strong></div>
        </div>
      </div>

      {factura.notas && (
        <div className="facturacion-notas">
          <h4>Notas</h4>
          <p>{factura.notas}</p>
        </div>
      )}

      {anulada && (
        <div className="facturacion-notas facturacion-notas-anulada">
          <h4>Anulación</h4>
          <p>Motivo: {factura.anulacion_motivo || '—'}</p>
          <p>
            Anulada el {formatearFechaHora(factura.anulada_en)}
            {factura.anulada_por_nombre ? ` por ${factura.anulada_por_nombre}` : ''}
          </p>
        </div>
      )}

      <div className="modal-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCerrar}>
          Cerrar
        </button>
        {onAnular && !anulada && (
          <button type="button" className="btn btn-danger" onClick={() => onAnular(factura)}>
            Anular factura
          </button>
        )}
        <button
          type="button"
          className="btn btn-primario"
          onClick={() => window.open(rutaImpresionFacturaVenta(factura.id), '_blank', 'noopener')}
        >
          Imprimir
        </button>
      </div>
    </Modal>
  );
}
