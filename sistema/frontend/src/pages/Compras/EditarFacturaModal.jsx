import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const FORM_VACIO = {
  fecha: '',
  serie: '',
  numero_factura: '',
  condicion: 'contado',
  fecha_vencimiento: '',
  notas: ''
};

export default function EditarFacturaModal({ abierto, compra, onCerrar, onGuardado }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!abierto || !compra) return;
    setError('');
    setForm({
      fecha: compra.fecha ? String(compra.fecha).slice(0, 10) : '',
      serie: compra.serie || '',
      numero_factura: compra.numero_factura || '',
      condicion: compra.condicion || 'contado',
      fecha_vencimiento: compra.fecha_vencimiento ? String(compra.fecha_vencimiento).slice(0, 10) : '',
      notas: compra.notas || ''
    });
  }, [abierto, compra]);

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(e) {
    e.preventDefault();
    if (!compra) return;
    setGuardando(true);
    setError('');
    try {
      await api.put(`/compras/${compra.id}`, {
        fecha: form.fecha,
        serie: form.serie.trim() || null,
        numero_factura: form.numero_factura.trim() || null,
        condicion: form.condicion,
        fecha_vencimiento: form.condicion === 'credito' ? form.fecha_vencimiento : null,
        notas: form.notas.trim() || null
      });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo={`Editar factura ${compra?.numero || ''}`} onCerrar={onCerrar} ancho="620px">
      <form onSubmit={guardar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}
        <div className="alerta alerta-info">
          Solo se pueden corregir los datos de cabecera y las notas. Los productos no se modifican.
          Si la factura tiene un error de productos, anúlela y registre una nueva.
        </div>
        <div className="form-grid">
          <label className="campo">
            <span>Fecha *</span>
            <input
              type="date"
              className="control"
              required
              value={form.fecha}
              onChange={(e) => actualizar('fecha', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Condición *</span>
            <select
              className="control"
              value={form.condicion}
              onChange={(e) => {
                const condicion = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  condicion,
                  fecha_vencimiento: condicion === 'contado' ? '' : prev.fecha_vencimiento
                }));
              }}
            >
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </label>
          <label className="campo">
            <span>Serie</span>
            <input
              type="text"
              className="control"
              value={form.serie}
              onChange={(e) => actualizar('serie', e.target.value)}
              placeholder="Ej: A"
            />
          </label>
          <label className="campo">
            <span>No. factura</span>
            <input
              type="text"
              className="control"
              value={form.numero_factura}
              onChange={(e) => actualizar('numero_factura', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Fecha de vencimiento {form.condicion === 'credito' ? '*' : ''}</span>
            <input
              type="date"
              className="control"
              required={form.condicion === 'credito'}
              disabled={form.condicion !== 'credito'}
              value={form.fecha_vencimiento}
              onChange={(e) => actualizar('fecha_vencimiento', e.target.value)}
            />
          </label>
          <label className="campo" style={{ gridColumn: '1 / -1' }}>
            <span>Notas</span>
            <textarea
              className="control"
              rows={3}
              value={form.notas}
              onChange={(e) => actualizar('notas', e.target.value)}
            />
          </label>
        </div>
        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
