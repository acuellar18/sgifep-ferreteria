import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { formatearFecha, formatearMoneda } from '../../utils/formatos';

const METODOS = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'transferencia', etiqueta: 'Transferencia' }
];

const FORMULARIO_INICIAL = {
  monto: '',
  metodo_pago: 'efectivo',
  referencia: '',
  notas: ''
};

export default function PosCuentasPorCobrar() {
  const notificar = useNotificacion();
  const [data, setData] = useState({ data: [], resumen: { facturas: 0, total: 0, vencido: 0 } });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [cuentaCobro, setCuentaCobro] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/pos/cuentas-por-cobrar');
      setData({
        data: res.data?.data || [],
        resumen: res.data?.resumen || { facturas: 0, total: 0, vencido: 0 }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirCobro(cuenta) {
    setCuentaCobro(cuenta);
    setFormulario({
      ...FORMULARIO_INICIAL,
      monto: Number(cuenta.saldo_pendiente || 0).toFixed(2)
    });
  }

  function cambiar(campo, valor) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }

  async function confirmarCobro(evento) {
    evento.preventDefault();
    const monto = Number(formulario.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      notificar.error('El monto debe ser mayor a 0');
      return;
    }
    if (monto > Number(cuentaCobro.saldo_pendiente) + 0.009) {
      notificar.error('El pago no puede superar el saldo pendiente');
      return;
    }
    if (formulario.metodo_pago === 'transferencia' && !formulario.referencia.trim()) {
      notificar.error('La referencia es obligatoria para transferencias');
      return;
    }

    setGuardando(true);
    try {
      await api.post(`/pos/cuentas-por-cobrar/${cuentaCobro.id}/pagos`, {
        monto,
        metodo_pago: formulario.metodo_pago,
        referencia: formulario.referencia.trim() || null,
        notas: formulario.notas.trim() || null
      });
      notificar.exito('Pago registrado correctamente');
      setCuentaCobro(null);
      await cargar();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="pos-cuentas">
      <div className="pos-cuentas-resumen">
        <article>
          <span>Facturas pendientes</span>
          <strong>{data.resumen.facturas}</strong>
        </article>
        <article>
          <span>Total por cobrar</span>
          <strong>{formatearMoneda(data.resumen.total)}</strong>
        </article>
        <article className="pos-cuentas-vencido">
          <span>Monto vencido</span>
          <strong>{formatearMoneda(data.resumen.vencido)}</strong>
        </article>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="tabla-wrapper pos-tabla-wrapper">
        <table className="tabla pos-tabla">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Cliente</th>
              <th>Emisión</th>
              <th>Vence</th>
              <th>Total</th>
              <th>Saldo</th>
              <th>Situación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="8" className="pos-tabla-vacia">Cargando cuentas por cobrar...</td></tr>
            ) : data.data.length === 0 ? (
              <tr><td colSpan="8" className="pos-tabla-vacia">No hay facturas pendientes de cobro.</td></tr>
            ) : (
              data.data.map((cuenta) => {
                const vencida = cuenta.dias_vencido !== null && cuenta.dias_vencido > 0;
                return (
                  <tr key={cuenta.id}>
                    <td><strong>{cuenta.numero}</strong></td>
                    <td>
                      <span className="pos-tabla-cliente">{cuenta.cliente_nombre}</span>
                      <small>{cuenta.cliente_nit}</small>
                    </td>
                    <td>{formatearFecha(cuenta.fecha)}</td>
                    <td>{cuenta.fecha_vencimiento ? formatearFecha(cuenta.fecha_vencimiento) : '—'}</td>
                    <td>{formatearMoneda(cuenta.total)}</td>
                    <td><strong>{formatearMoneda(cuenta.saldo_pendiente)}</strong></td>
                    <td>
                      {cuenta.contra_entrega ? (
                        <span className="chip chip-aviso">Contra entrega</span>
                      ) : (
                        <span className={`chip ${vencida ? 'chip-peligro' : 'chip-ok'}`}>
                          {vencida
                            ? `Vencida ${cuenta.dias_vencido} d`
                            : cuenta.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primario btn-mini"
                        onClick={() => abrirCobro(cuenta)}
                      >
                        Registrar pago
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        abierto={Boolean(cuentaCobro)}
        titulo={`Cobrar factura ${cuentaCobro?.numero || ''}`}
        onCerrar={() => !guardando && setCuentaCobro(null)}
        ancho="520px"
      >
        {cuentaCobro && (
          <form className="pos-form-cobro" onSubmit={confirmarCobro}>
            <div className="pos-cobro-resumen">
              <span>Cliente</span>
              <strong>{cuentaCobro.cliente_nombre}</strong>
              <span>Saldo pendiente</span>
              <strong>{formatearMoneda(cuentaCobro.saldo_pendiente)}</strong>
            </div>

            <label className="campo">
              <span>Monto a cobrar *</span>
              <input
                type="number"
                className="control"
                min="0.01"
                step="0.01"
                max={cuentaCobro.saldo_pendiente}
                value={formulario.monto}
                onChange={(e) => cambiar('monto', e.target.value)}
                required
              />
            </label>

            <label className="campo">
              <span>Método de pago *</span>
              <select
                className="control"
                value={formulario.metodo_pago}
                onChange={(e) => cambiar('metodo_pago', e.target.value)}
              >
                {METODOS.map((metodo) => (
                  <option key={metodo.valor} value={metodo.valor}>{metodo.etiqueta}</option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span>
                Referencia {formulario.metodo_pago === 'transferencia' ? '*' : '(opcional)'}
              </span>
              <input
                type="text"
                className="control"
                maxLength={100}
                value={formulario.referencia}
                onChange={(e) => cambiar('referencia', e.target.value)}
                placeholder="Número de autorización o boleta"
                required={formulario.metodo_pago === 'transferencia'}
              />
            </label>

            <label className="campo">
              <span>Notas (opcional)</span>
              <textarea
                className="control"
                rows="2"
                maxLength={255}
                value={formulario.notas}
                onChange={(e) => cambiar('notas', e.target.value)}
              />
            </label>

            <p className="pos-cobro-aviso">
              Debes tener una caja abierta para registrar el cobro.
            </p>

            <div className="modal-acciones">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setCuentaCobro(null)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primario" disabled={guardando}>
                {guardando ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
