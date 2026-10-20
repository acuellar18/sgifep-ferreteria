import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';

const FORM_VACIO = {
  codigo: '',
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  categoria_id: '',
  tipo: 'producto',
  unidad_medida: 'UNI',
  stock_minimo: '0',
  precio_venta: '0',
  stock_inicial: '0',
  costo_inicial: '0',
  activo: true
};

function desdeProducto(producto) {
  return {
    codigo: producto.codigo || '',
    codigo_barras: producto.codigo_barras || '',
    nombre: producto.nombre || '',
    descripcion: producto.descripcion || '',
    categoria_id: producto.categoria_id ? String(producto.categoria_id) : '',
    tipo: producto.tipo || 'producto',
    unidad_medida: producto.unidad_medida || 'UNI',
    stock_minimo: String(producto.stock_minimo ?? 0),
    precio_venta: String(producto.precio_venta ?? 0),
    stock_inicial: '0',
    costo_inicial: '0',
    activo: Boolean(producto.activo)
  };
}

export default function ProductoFormModal({
  abierto,
  producto,
  categorias,
  permisos,
  onCerrar,
  onGuardado
}) {
  const [form, setForm] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const esAlta = !producto;
  const esServicio = form.tipo === 'servicio';

  useEffect(() => {
    if (!abierto) return;
    setError('');
    setForm(producto ? desdeProducto(producto) : FORM_VACIO);
  }, [abierto, producto]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const payload = {
      codigo: form.codigo.trim(),
      codigo_barras: form.codigo_barras.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      tipo: form.tipo,
      unidad_medida: form.unidad_medida,
      stock_minimo: Number(form.stock_minimo || 0),
      precio_venta: Number(form.precio_venta || 0),
      activo: form.activo
    };

    if (esAlta) {
      payload.stock_inicial = esServicio ? 0 : Number(form.stock_inicial || 0);
      if (permisos.verCostosProductos) {
        payload.costo_inicial = Number(form.costo_inicial || 0);
      }
    }

    try {
      if (esAlta) {
        await api.post('/productos', payload);
        onGuardado('Producto creado correctamente');
      } else {
        await api.put(`/productos/${producto.id}`, payload);
        onGuardado('Producto actualizado correctamente');
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
      titulo={esAlta ? 'Agregar producto' : 'Editar producto'}
      onCerrar={onCerrar}
      ancho="760px"
    >
      <form onSubmit={enviar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="form-grid">
          <label className="campo">
            <span>Código *</span>
            <input
              type="text"
              className="control"
              required
              maxLength={30}
              value={form.codigo}
              onChange={(e) => actualizarCampo('codigo', e.target.value.toUpperCase())}
              autoFocus
            />
          </label>

          <label className="campo">
            <span>Código de barras</span>
            <input
              type="text"
              className="control"
              maxLength={80}
              value={form.codigo_barras}
              onChange={(e) => actualizarCampo('codigo_barras', e.target.value)}
            />
          </label>

          <label className="campo inventario-campo-ancho">
            <span>Nombre *</span>
            <input
              type="text"
              className="control"
              required
              maxLength={150}
              value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
            />
          </label>

          <label className="campo">
            <span>Tipo *</span>
            <select
              className="control"
              value={form.tipo}
              onChange={(e) => actualizarCampo('tipo', e.target.value)}
            >
              <option value="producto">Producto</option>
              <option value="servicio">Servicio</option>
            </select>
          </label>

          <label className="campo">
            <span>Categoría</span>
            <select
              className="control"
              value={form.categoria_id}
              onChange={(e) => actualizarCampo('categoria_id', e.target.value)}
            >
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Unidad de medida *</span>
            <select
              className="control"
              value={form.unidad_medida}
              onChange={(e) => actualizarCampo('unidad_medida', e.target.value)}
            >
              <option value="UNI">Unidad</option>
              <option value="MTS">Metro</option>
              <option value="KG">Kilogramo</option>
              <option value="LT">Litro</option>
              <option value="GL">Galón</option>
              <option value="CJA">Caja</option>
              <option value="PAQ">Paquete</option>
              <option value="ROL">Rollo</option>
            </select>
          </label>

          <label className="campo">
            <span>Precio de venta *</span>
            <input
              type="number"
              className="control"
              min="0"
              step="0.01"
              required
              value={form.precio_venta}
              onChange={(e) => actualizarCampo('precio_venta', e.target.value)}
            />
          </label>

          {!esServicio && (
            <label className="campo">
              <span>Stock mínimo *</span>
              <input
                type="number"
                className="control"
                min="0"
                step="0.001"
                required
                value={form.stock_minimo}
                onChange={(e) => actualizarCampo('stock_minimo', e.target.value)}
              />
            </label>
          )}

          {esAlta && !esServicio && permisos.verCostosProductos && (
            <label className="campo">
              <span>Costo inicial *</span>
              <input
                type="number"
                className="control"
                min="0"
                step="0.01"
                value={form.costo_inicial}
                onChange={(e) => actualizarCampo('costo_inicial', e.target.value)}
              />
            </label>
          )}

          {esAlta && !esServicio && (
            <label className="campo">
              <span>Inventario inicial *</span>
              <input
                type="number"
                className="control"
                min="0"
                step="0.001"
                value={form.stock_inicial}
                onChange={(e) => actualizarCampo('stock_inicial', e.target.value)}
              />
            </label>
          )}

          <label className="campo inventario-campo-ancho">
            <span>Descripción</span>
            <textarea
              className="control"
              rows={3}
              maxLength={500}
              value={form.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
            />
          </label>
        </div>

        {esServicio && (
          <p className="inventario-form-ayuda">
            Los servicios no controlan existencias: no tienen stock, costo promedio ni movimientos de inventario.
          </p>
        )}

        {!esAlta && (
          <p className="inventario-form-ayuda">
            Stock actual: {form.tipo === 'servicio' ? 'N/A' : formatearNumero(producto.stock_actual, 3)}
            {permisos.verCostosProductos && form.tipo === 'producto'
              ? ` · Costo promedio: ${formatearMoneda(producto.costo_promedio)}`
              : ''}
            . El stock solo cambia mediante compras, ventas y movimientos de inventario.
          </p>
        )}

        {esAlta && !esServicio && (
          <p className="inventario-form-ayuda">
            El inventario inicial genera un movimiento de entrada. Después solo puede modificarse con movimientos.
          </p>
        )}

        <label className="campo campo-check">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => actualizarCampo('activo', e.target.checked)}
          />
          Producto activo
        </label>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {cargando ? 'Guardando...' : esAlta ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
