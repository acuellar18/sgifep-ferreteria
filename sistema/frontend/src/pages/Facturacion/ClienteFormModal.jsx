import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import api from '../../services/api';

const FORMULARIO_VACIO = {
  nit: '',
  nombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  dias_credito: 0,
  limite_credito: 0,
  estado: 'activo'
};

function desdeCliente(cliente) {
  if (!cliente) return { ...FORMULARIO_VACIO };
  return {
    nit: cliente.nit || '',
    nombre: cliente.nombre || '',
    telefono: cliente.telefono || '',
    correo: cliente.correo || '',
    direccion: cliente.direccion || '',
    dias_credito: Number(cliente.dias_credito ?? 0),
    limite_credito: Number(cliente.limite_credito ?? 0),
    estado: cliente.estado === 'inactivo' ? 'inactivo' : 'activo'
  };
}

export default function ClienteFormModal({ abierto, cliente, onCerrar, onGuardado }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const editando = Boolean(cliente);

  useEffect(() => {
    if (!abierto) return;
    setFormulario(desdeCliente(cliente));
    setError('');
    setGuardando(false);
  }, [abierto, cliente]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  }

  function cambiarEstado(evento) {
    setFormulario((actual) => ({
      ...actual,
      estado: evento.target.checked ? 'activo' : 'inactivo'
    }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');

    const nit = formulario.nit.trim().toUpperCase();
    const nombre = formulario.nombre.trim();
    const diasCredito = Number(formulario.dias_credito);
    const limiteCredito = Number(formulario.limite_credito);

    if (!nit) {
      setError('El NIT es obligatorio.');
      return;
    }
    if (!nombre) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    if (!Number.isInteger(diasCredito) || diasCredito < 0 || diasCredito > 3650) {
      setError('Los días de crédito deben ser un entero entre 0 y 3650.');
      return;
    }
    if (!Number.isFinite(limiteCredito) || limiteCredito < 0) {
      setError('El límite de crédito debe ser mayor o igual a 0.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        nit,
        nombre,
        telefono: formulario.telefono.trim(),
        correo: formulario.correo.trim(),
        direccion: formulario.direccion.trim(),
        dias_credito: diasCredito,
        limite_credito: limiteCredito,
        estado: formulario.estado
      };

      const respuesta = editando
        ? await api.put(`/clientes/${cliente.id}`, payload)
        : await api.post('/clientes', payload);

      onGuardado(respuesta.mensaje || (editando ? 'Cliente actualizado' : 'Cliente creado'));
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar cliente' : 'Nuevo cliente'}
      onCerrar={onCerrar}
      ancho="640px"
    >
      <form className="facturacion-formulario" onSubmit={guardar}>
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="facturacion-form-grid">
          <div className="campo">
            <label htmlFor="cliente-nit">NIT *</label>
            <input
              id="cliente-nit"
              name="nit"
              className="control"
              value={formulario.nit}
              onChange={cambiar}
              maxLength={20}
              placeholder="CF o NIT del cliente"
              autoFocus
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="cliente-telefono">Teléfono</label>
            <input
              id="cliente-telefono"
              name="telefono"
              className="control"
              value={formulario.telefono}
              onChange={cambiar}
              maxLength={30}
              placeholder="5555-5555"
            />
          </div>

          <div className="campo facturacion-form-completo">
            <label htmlFor="cliente-nombre">Nombre o razón social *</label>
            <input
              id="cliente-nombre"
              name="nombre"
              className="control"
              value={formulario.nombre}
              onChange={cambiar}
              maxLength={150}
              placeholder="Nombre completo del cliente"
              required
            />
          </div>

          <div className="campo facturacion-form-completo">
            <label htmlFor="cliente-correo">Correo electrónico</label>
            <input
              id="cliente-correo"
              name="correo"
              type="email"
              className="control"
              value={formulario.correo}
              onChange={cambiar}
              maxLength={150}
              placeholder="cliente@correo.com"
            />
          </div>

          <div className="campo facturacion-form-completo">
            <label htmlFor="cliente-direccion">Dirección</label>
            <input
              id="cliente-direccion"
              name="direccion"
              className="control"
              value={formulario.direccion}
              onChange={cambiar}
              maxLength={255}
              placeholder="Dirección del cliente"
            />
          </div>

          <div className="campo">
            <label htmlFor="cliente-dias">Días de crédito</label>
            <input
              id="cliente-dias"
              name="dias_credito"
              type="number"
              min="0"
              max="3650"
              step="1"
              className="control"
              value={formulario.dias_credito}
              onChange={cambiar}
            />
          </div>

          <div className="campo">
            <label htmlFor="cliente-limite">Límite de crédito (Q)</label>
            <input
              id="cliente-limite"
              name="limite_credito"
              type="number"
              min="0"
              step="0.01"
              className="control"
              value={formulario.limite_credito}
              onChange={cambiar}
            />
          </div>
        </div>

        <label className="facturacion-check">
          <input
            type="checkbox"
            checked={formulario.estado === 'activo'}
            onChange={cambiarEstado}
          />
          <span>Cliente activo para facturación</span>
        </label>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
