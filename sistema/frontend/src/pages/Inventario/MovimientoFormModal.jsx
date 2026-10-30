import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { formatearNumero } from '../../utils/formatos';

const MOTIVOS_POR_TIPO = {
  entrada: ['Compra', 'Devolución', 'Ajuste de inventario', 'Otro'],
  salida: ['Venta', 'Merma', 'Daño', 'Uso interno', 'Otro'],
  ajuste: ['Ajuste de inventario', 'Otro']
};

const FORM_VACIO = {
  tipo: 'entrada',
  cantidad: '',
  motivo: '',
  referencia: '',
  observaciones: ''
};

function numeroCantidad(valor) {
  const numero = Number(valor || 0);
  return formatearNumero(numero, Number.isInteger(numero) ? 0 : 2);
}

export default function MovimientoFormModal({ abierto, onCerrar, onGuardado }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [producto, setProducto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const motivos = MOTIVOS_POR_TIPO[form.tipo] || [];

  useEffect(() => {
    if (!abierto) return;
    setForm(FORM_VACIO);
    setProducto(null);
    setBusqueda('');
    setResultados([]);
    setMostrarResultados(true);
    setError('');
  }, [abierto]);

  useEffect(() => {
    if (!abierto || !mostrarResultados) return undefined;

    let activo = true;
    const temporizador = window.setTimeout(async () => {
      setBuscando(true);
      try {
        let filas = [];
        const texto = busqueda.trim();
        if (texto.length >= 2) {
          const respuesta = await api.get('/productos/autocompletar', {
            params: { q: texto, limite: 20 }
          });
          filas = respuesta.data || [];
        } else {
          const respuesta = await api.get('/productos', {
            params: {
              estado: 'activo',
              page: 1,
              pageSize: 30,
              sortBy: 'nombre',
              sortDir: 'asc'
            }
          });
          filas = respuesta.data || [];
        }
        if (activo) {
          setResultados(filas.filter((fila) => fila.tipo !== 'servicio'));
        }
      } catch {
        if (activo) setResultados([]);
      } finally {
        if (activo) setBuscando(false);
      }
    }, 250);

    return () => {
      activo = false;
      window.clearTimeout(temporizador);
    };
  }, [abierto, busqueda, mostrarResultados]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function cambiarTipo(tipo) {
    setForm((prev) => ({ ...prev, tipo, motivo: '' }));
  }

  function escribirBusqueda(valor) {
    setBusqueda(valor);
    setProducto(null);
    setMostrarResultados(true);
  }

  function seleccionarProducto(fila) {
    setProducto(fila);
    setBusqueda('');
    setMostrarResultados(false);
    setError('');
  }

  function cambiarProducto() {
    setProducto(null);
    setBusqueda('');
    setMostrarResultados(true);
  }

  function stockResultante() {
    if (!producto) return null;
    const actual = Number(producto.stock_actual || 0);
    const cantidad = Number(form.cantidad);
    if (!Number.isFinite(cantidad)) return null;
    if (form.tipo === 'entrada') return actual + cantidad;
    if (form.tipo === 'salida') return actual - cantidad;
    return cantidad;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError('');

    if (!producto) {
      setError('Seleccione un producto');
      return;
    }

    const cantidad = Number(form.cantidad);
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      setError('Ingrese una cantidad válida');
      return;
    }
    if (form.tipo !== 'ajuste' && cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }
    if (form.tipo === 'salida' && cantidad > Number(producto.stock_actual || 0)) {
      setError('El stock actual no es suficiente para registrar la salida');
      return;
    }
    if (
      form.tipo === 'ajuste' &&
      Math.abs(cantidad - Number(producto.stock_actual || 0)) < 0.0005
    ) {
      setError('El nuevo stock debe ser diferente al stock actual');
      return;
    }
    if (!form.motivo) {
      setError('Seleccione un motivo');
      return;
    }

    setCargando(true);
    try {
      await api.post('/movimientos-inventario', {
        producto_id: producto.id,
        tipo: form.tipo,
        cantidad,
        motivo: form.motivo,
        referencia: form.referencia.trim(),
        observaciones: form.observaciones.trim()
      });
      onGuardado('Movimiento registrado correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const resultado = stockResultante();

  return (
    <Modal
      abierto={abierto}
      titulo="Registrar movimiento"
      onCerrar={onCerrar}
      ancho="660px"
    >
      <form onSubmit={enviar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="campo movimiento-producto-campo">
          <span>Producto *</span>

          {producto ? (
            <div className="movimiento-producto-seleccionado">
              <div className="movimiento-producto-datos">
                <strong>{producto.nombre}</strong>
                <span>{producto.codigo}</span>
              </div>
              <div className="movimiento-producto-stock">
                Stock actual: <strong>{numeroCantidad(producto.stock_actual)}</strong>{' '}
                {producto.unidad_medida || 'UNI'}
              </div>
              <button type="button" className="btn btn-opcion" onClick={cambiarProducto}>
                Cambiar
              </button>
            </div>
          ) : (
            <div className="movimiento-buscador-producto">
              <input
                type="text"
                className="control"
                placeholder="Buscar por nombre, código o código de barras..."
                value={busqueda}
                onChange={(evento) => escribirBusqueda(evento.target.value)}
                onFocus={() => setMostrarResultados(true)}
                autoFocus
              />

              {mostrarResultados && (
                <div className="movimiento-producto-lista" role="listbox">
                  {buscando ? (
                    <p className="movimiento-producto-vacio">Buscando productos...</p>
                  ) : resultados.length === 0 ? (
                    <p className="movimiento-producto-vacio">
                      No se encontraron productos activos.
                    </p>
                  ) : (
                    resultados.map((fila) => (
                      <button
                        key={fila.id}
                        type="button"
                        className="movimiento-producto-opcion"
                        role="option"
                        aria-selected="false"
                        onClick={() => seleccionarProducto(fila)}
                      >
                        <span>
                          <strong>{fila.nombre}</strong>
                          <small>{fila.codigo}</small>
                        </span>
                        <span className="movimiento-producto-opcion-stock">
                          {numeroCantidad(fila.stock_actual)} {fila.unidad_medida || 'UNI'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="movimiento-form-grid">
          <label className="campo">
            <span>Tipo de movimiento *</span>
            <select
              className="control"
              value={form.tipo}
              onChange={(evento) => cambiarTipo(evento.target.value)}
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </label>

          <label className="campo">
            <span>Motivo *</span>
            <select
              className="control"
              value={form.motivo}
              onChange={(evento) => actualizarCampo('motivo', evento.target.value)}
              required
            >
              <option value="">Seleccione un motivo</option>
              {motivos.map((motivo) => (
                <option key={motivo} value={motivo}>{motivo}</option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>{form.tipo === 'ajuste' ? 'Nuevo stock real *' : 'Cantidad *'}</span>
            <input
              type="number"
              className="control"
              min={form.tipo === 'ajuste' ? '0' : '0.001'}
              step="0.001"
              value={form.cantidad}
              onChange={(evento) => actualizarCampo('cantidad', evento.target.value)}
              required
            />
          </label>

          <label className="campo">
            <span>Referencia</span>
            <input
              type="text"
              className="control"
              maxLength={120}
              placeholder="# de compra, factura o documento"
              value={form.referencia}
              onChange={(evento) => actualizarCampo('referencia', evento.target.value)}
            />
          </label>
        </div>

        <label className="campo">
          <span>Observaciones</span>
          <textarea
            className="control"
            rows={3}
            maxLength={500}
            placeholder="Detalle adicional del movimiento (opcional)"
            value={form.observaciones}
            onChange={(evento) => actualizarCampo('observaciones', evento.target.value)}
          />
        </label>

        {producto && resultado !== null && (
          <div className="movimiento-preview">
            <span>
              Stock actual: <strong>{numeroCantidad(producto.stock_actual)}</strong>
            </span>
            <span aria-hidden="true">→</span>
            <span>
              Nuevo stock:{' '}
              <strong className={resultado < 0 ? 'movimiento-preview-negativo' : ''}>
                {numeroCantidad(resultado)}
              </strong>{' '}
              {producto.unidad_medida || 'UNI'}
            </span>
          </div>
        )}

        <p className="inventario-form-ayuda">
          {form.tipo === 'ajuste'
            ? 'En un ajuste, la cantidad es el stock real que existe hoy. El sistema registra la diferencia.'
            : 'El stock del producto se actualiza automáticamente al guardar el movimiento.'}
        </p>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
