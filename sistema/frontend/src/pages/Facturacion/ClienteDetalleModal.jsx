import Modal from '../../components/Modal';
import {
  etiquetaEstado,
  etiquetaEstadoPago,
  formatearFecha,
  formatearMoneda
} from '../../utils/formatos';

function Dato({ etiqueta, children, completo = false }) {
  return (
    <div className={`facturacion-detalle-dato${completo ? ' facturacion-detalle-completo' : ''}`}>
      <span>{etiqueta}</span>
      <strong>{children || '—'}</strong>
    </div>
  );
}

export default function ClienteDetalleModal({ cliente, onCerrar, onEditar }) {
  const abierto = Boolean(cliente);
  const facturas = Array.isArray(cliente?.facturas) ? cliente.facturas : [];

  return (
    <Modal abierto={abierto} titulo="Detalle del cliente" onCerrar={onCerrar} ancho="760px">
      {cliente?.cargando ? (
        <p className="estado">Cargando detalle del cliente...</p>
      ) : cliente ? (
        <>
          <div className="facturacion-detalle-cabecera">
            <div>
              <div className="facturacion-detalle-titulo">
                <h3>{cliente.nombre}</h3>
                <span className={`chip ${cliente.estado === 'activo' ? 'chip-ok' : 'chip-peligro'}`}>
                  {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
                {cliente.es_predeterminado && (
                  <span className="chip chip-rol">Predeterminado</span>
                )}
              </div>
              <p className="reporte-detalle">NIT {cliente.nit}</p>
            </div>
            <div className="facturacion-detalle-saldo">
              <span>Saldo actual</span>
              <strong>{formatearMoneda(cliente.saldo_actual)}</strong>
              <small>
                {cliente.facturas_pendientes
                  ? `${cliente.facturas_pendientes} factura(s) pendiente(s)`
                  : 'Sin facturas pendientes'}
              </small>
            </div>
          </div>

          <div className="facturacion-detalle-grid">
            <Dato etiqueta="Teléfono">{cliente.telefono}</Dato>
            <Dato etiqueta="Correo">{cliente.correo}</Dato>
            <Dato etiqueta="Días de crédito">{`${cliente.dias_credito} días`}</Dato>
            <Dato etiqueta="Límite de crédito">{formatearMoneda(cliente.limite_credito)}</Dato>
            <Dato etiqueta="Dirección" completo>{cliente.direccion}</Dato>
            <Dato etiqueta="Registrado">{formatearFecha(cliente.created_at)}</Dato>
          </div>

          <div className="facturacion-historial">
            <div className="facturacion-historial-encabezado">
              <h4>Historial de facturas</h4>
              <span>{facturas.length} registro(s)</span>
            </div>

            {facturas.length === 0 ? (
              <div className="inventario-vacio facturacion-historial-vacio">
                <p>Este cliente todavía no tiene facturas registradas.</p>
                <small>Las facturas emitidas aparecerán aquí con su saldo y estado.</small>
              </div>
            ) : (
              <div className="tabla-wrapper">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Saldo</th>
                      <th>Estado</th>
                      <th>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((factura) => (
                      <tr key={factura.id}>
                        <td>{factura.numero || factura.id}</td>
                        <td>{formatearFecha(factura.fecha)}</td>
                        <td className="reporte-numero">{formatearMoneda(factura.total)}</td>
                        <td className="reporte-numero">{formatearMoneda(factura.saldo)}</td>
                        <td>{etiquetaEstado(factura.estado)}</td>
                        <td>
                          {factura.estado === 'anulada'
                            ? '—'
                            : etiquetaEstadoPago(factura.estado_pago)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={onCerrar}>
              Cerrar
            </button>
            {onEditar && (
              <button type="button" className="btn btn-primario" onClick={onEditar}>
                Editar cliente
              </button>
            )}
          </div>
        </>
      ) : null}
    </Modal>
  );
}
