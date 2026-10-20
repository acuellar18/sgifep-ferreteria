import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';

const FORM_VACIO = {
  nombre: '',
  nit: '',
  direccion: '',
  telefono: '',
  correo: '',
  logo_url: '/img/logo.png'
};

export default function ConfiguracionEmpresaModal({ abierto, onCerrar }) {
  const notificar = useNotificacion();
  const [form, setForm] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    setCargando(true);
    setError('');
    api.get('/configuracion-empresa')
      .then((res) => {
        if (!activo) return;
        setForm({ ...FORM_VACIO, ...(res.data || {}) });
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [abierto]);

  function actualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const res = await api.put('/configuracion-empresa', {
        nombre: form.nombre.trim(),
        nit: form.nit.trim() || null,
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        logo_url: form.logo_url.trim() || null
      });
      setForm({ ...FORM_VACIO, ...(res.data || {}) });
      notificar.exito('Configuración de la empresa actualizada');
      onCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo="Datos de la empresa" onCerrar={onCerrar} ancho="680px">
      <form onSubmit={guardar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}
        {cargando ? (
          <p className="estado">Cargando configuración...</p>
        ) : (
          <>
            <p className="reporte-detalle">
              Estos datos se muestran en las facturas y listados impresos.
            </p>
            <div className="form-grid">
              <label className="campo" style={{ gridColumn: '1 / -1' }}>
                <span>Nombre o razón social *</span>
                <input
                  type="text"
                  className="control"
                  required
                  value={form.nombre}
                  onChange={(e) => actualizar('nombre', e.target.value)}
                />
              </label>
              <label className="campo">
                <span>NIT</span>
                <input
                  type="text"
                  className="control"
                  value={form.nit || ''}
                  onChange={(e) => actualizar('nit', e.target.value)}
                />
              </label>
              <label className="campo">
                <span>Teléfono</span>
                <input
                  type="text"
                  className="control"
                  value={form.telefono || ''}
                  onChange={(e) => actualizar('telefono', e.target.value)}
                />
              </label>
              <label className="campo" style={{ gridColumn: '1 / -1' }}>
                <span>Dirección</span>
                <input
                  type="text"
                  className="control"
                  value={form.direccion || ''}
                  onChange={(e) => actualizar('direccion', e.target.value)}
                />
              </label>
              <label className="campo">
                <span>Correo</span>
                <input
                  type="email"
                  className="control"
                  value={form.correo || ''}
                  onChange={(e) => actualizar('correo', e.target.value)}
                />
              </label>
              <label className="campo">
                <span>Ruta del logo</span>
                <input
                  type="text"
                  className="control"
                  value={form.logo_url || ''}
                  onChange={(e) => actualizar('logo_url', e.target.value)}
                  placeholder="/img/logo.png"
                />
              </label>
            </div>
          </>
        )}
        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={cargando || guardando}>
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
