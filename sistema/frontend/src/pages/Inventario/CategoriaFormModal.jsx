import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const FORM_VACIO = {
  nombre: '',
  descripcion: '',
  activo: true
};

export default function CategoriaFormModal({ abierto, categoria, onCerrar, onGuardado, onCreada }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const esAlta = !categoria;

  useEffect(() => {
    if (!abierto) return;
    setError('');
    if (categoria) {
      setForm({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        activo: Boolean(categoria.activo)
      });
    } else {
      setForm(FORM_VACIO);
    }
  }, [abierto, categoria]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      activo: form.activo
    };

    try {
      if (esAlta) {
        const respuesta = await api.post('/categorias', payload);
        onCreada?.(respuesta.data);
        onGuardado('Categoría creada correctamente');
      } else {
        await api.put(`/categorias/${categoria.id}`, payload);
        onGuardado('Categoría actualizada correctamente');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo={esAlta ? 'Agregar categoría' : 'Editar categoría'}
      onCerrar={onCerrar}
      ancho="520px"
    >
      <form onSubmit={enviar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}

        <label className="campo">
          <span>Nombre *</span>
          <input
            type="text"
            className="control"
            required
            maxLength={100}
            value={form.nombre}
            onChange={(e) => actualizarCampo('nombre', e.target.value)}
            autoFocus
          />
        </label>

        <label className="campo">
          <span>Descripción</span>
          <textarea
            className="control"
            rows={3}
            maxLength={255}
            value={form.descripcion}
            onChange={(e) => actualizarCampo('descripcion', e.target.value)}
          />
        </label>

        <label className="campo campo-check">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => actualizarCampo('activo', e.target.checked)}
          />
          Categoría activa
        </label>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {cargando ? 'Guardando...' : esAlta ? 'Crear categoría' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
