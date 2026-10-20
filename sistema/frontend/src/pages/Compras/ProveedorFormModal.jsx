import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const FORM_VACIO = {
  nombre: '',
  nit: '',
  dpi: '',
  contacto_nombre: '',
  telefono: '',
  telefono2: '',
  correo: '',
  direccion: '',
  dias_credito: 0,
  notas: '',
  activo: true
};

export default function ProveedorFormModal({ abierto, proveedor, onCerrar, onGuardado }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const esAlta = !proveedor;

  useEffect(() => {
    if (!abierto) return;
    setError('');
    if (proveedor) {
      setForm({
        nombre: proveedor.nombre || '',
        nit: proveedor.nit || '',
        dpi: proveedor.dpi || '',
        contacto_nombre: proveedor.contacto_nombre || '',
        telefono: proveedor.telefono || '',
        telefono2: proveedor.telefono2 || '',
        correo: proveedor.correo || '',
        direccion: proveedor.direccion || '',
        dias_credito: proveedor.dias_credito || 0,
        notas: proveedor.notas || '',
        activo: Boolean(proveedor.activo)
      });
    } else {
      setForm(FORM_VACIO);
    }
  }, [abierto, proveedor]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const payload = {
      nombre: form.nombre.trim(),
      nit: form.nit.trim().toUpperCase() || null,
      dpi: form.dpi.replace(/\s/g, '') || null,
      contacto_nombre: form.contacto_nombre.trim() || null,
      telefono: form.telefono.trim() || null,
      telefono2: form.telefono2.trim() || null,
      correo: form.correo.trim().toLowerCase() || null,
      direccion: form.direccion.trim() || null,
      dias_credito: Number(form.dias_credito) || 0,
      notas: form.notas.trim() || null,
      activo: form.activo
    };

    try {
      if (esAlta) {
        await api.post('/proveedores', payload);
        onGuardado('Proveedor creado correctamente');
      } else {
        await api.put(`/proveedores/${proveedor.id}`, payload);
        onGuardado('Proveedor actualizado correctamente');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo={esAlta ? 'Agregar proveedor' : 'Editar proveedor'} onCerrar={onCerrar} ancho="640px">
      <form onSubmit={enviar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="form-grid">
          <label className="campo">
            <span>Nombre / Razón social *</span>
            <input
              type="text"
              className="control"
              required
              value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              autoFocus
            />
          </label>
          <label className="campo">
            <span>NIT (ej: 12345678-9)</span>
            <input
              type="text"
              className="control"
              value={form.nit}
              onChange={(e) => actualizarCampo('nit', e.target.value.toUpperCase())}
              placeholder="12345678-9"
            />
          </label>
          <label className="campo">
            <span>DPI / CUI</span>
            <input
              type="text"
              className="control"
              maxLength={13}
              value={form.dpi}
              onChange={(e) => actualizarCampo('dpi', e.target.value.replace(/\D/g, ''))}
              placeholder="13 dígitos"
            />
          </label>
          <label className="campo">
            <span>Contacto</span>
            <input
              type="text"
              className="control"
              value={form.contacto_nombre}
              onChange={(e) => actualizarCampo('contacto_nombre', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Teléfono</span>
            <input
              type="tel"
              className="control"
              value={form.telefono}
              onChange={(e) => actualizarCampo('telefono', e.target.value)}
              placeholder="5555-5555"
            />
          </label>
          <label className="campo">
            <span>Teléfono alterno</span>
            <input
              type="tel"
              className="control"
              value={form.telefono2}
              onChange={(e) => actualizarCampo('telefono2', e.target.value)}
              placeholder="5555-5555"
            />
          </label>
          <label className="campo">
            <span>Correo</span>
            <input
              type="email"
              className="control"
              value={form.correo}
              onChange={(e) => actualizarCampo('correo', e.target.value)}
              placeholder="proveedor@ejemplo.com"
            />
          </label>
          <label className="campo" style={{ gridColumn: '1 / -1' }}>
            <span>Dirección</span>
            <textarea
              className="control"
              rows={2}
              value={form.direccion}
              onChange={(e) => actualizarCampo('direccion', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Días de crédito</span>
            <input
              type="number"
              className="control"
              min="0"
              value={form.dias_credito}
              onChange={(e) => actualizarCampo('dias_credito', e.target.value)}
            />
          </label>
          <label className="campo" style={{ gridColumn: '1 / -1' }}>
            <span>Notas</span>
            <textarea
              className="control"
              rows={2}
              value={form.notas}
              onChange={(e) => actualizarCampo('notas', e.target.value)}
            />
          </label>
        </div>

        <label className="campo campo-check">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => actualizarCampo('activo', e.target.checked)}
          />
          Proveedor activo
        </label>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {cargando ? 'Guardando...' : esAlta ? 'Crear proveedor' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}