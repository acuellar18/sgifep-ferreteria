import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import FiltrosCompras from '../../components/FiltrosCompras';
import MenuAcciones from '../../components/MenuAcciones';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import { useNotificacion } from '../../components/Toast';
import { formatearFecha } from '../../utils/formatos';
import { permisosInventario } from '../../utils/permisosInventario';
import CategoriaFormModal from './CategoriaFormModal';

const FILTROS_INICIALES = {
  q: '',
  estado: 'todos'
};

const PAGE_SIZE = 10;

export default function CategoriasPage() {
  const notificar = useNotificacion();
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [orden, setOrden] = useState({ sortBy: 'codigo', sortDir: 'asc' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const solicitudActual = useRef(0);

  const permisos = permisosInventario();
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cargarCategorias = useCallback(async (filtrosActuales, paginaActual, ordenActual) => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    setError('');
    try {
      const params = { page: paginaActual, pageSize: PAGE_SIZE, ...ordenActual };
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/categorias', { params });
      if (solicitud !== solicitudActual.current) return;
      setCategorias(res.data || []);
      const nuevoTotal = Number(res.total ?? res.data?.length ?? 0);
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (paginaActual > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;
      setCategorias([]);
      setTotal(0);
      setError(err.message);
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCategorias(filtros, pagina, orden);
  }, [pagina, orden, cargarCategorias]);

  function aplicarFiltros(e) {
    e.preventDefault();
    setPagina(1);
    if (pagina === 1) cargarCategorias(filtros, 1, orden);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
    if (pagina === 1) cargarCategorias(FILTROS_INICIALES, 1, orden);
  }

  function cambiarOrden(sortBy, sortDir) {
    setOrden({ sortBy, sortDir });
  }

  function abrirAlta() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(categoria) {
    setEditando(categoria);
    setModalAbierto(true);
  }

  async function confirmarAccion() {
    const objetivo = confirmando;
    if (!objetivo) return;
    setError('');
    try {
      if (objetivo.accion === 'estado') {
        await api.patch(`/categorias/${objetivo.id}/estado`, { activo: objetivo.activo ? 0 : 1 });
        notificar.exito(objetivo.activo ? 'Categoría inactivada' : 'Categoría activada');
      } else if (objetivo.accion === 'eliminar') {
        await api.delete(`/categorias/${objetivo.id}`);
        notificar.exito('Categoría eliminada correctamente');
      }
      setConfirmando(null);
      await cargarCategorias(filtros, pagina, orden);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      setConfirmando(null);
    }
  }

  async function alGuardar(mensaje) {
    setModalAbierto(false);
    setEditando(null);
    notificar.exito(mensaje || 'Categoría guardada correctamente');
    await cargarCategorias(filtros, pagina, orden);
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h2>Categorías</h2>
          <p className="reporte-detalle">Agrupa los productos del inventario y consulta cuántos tienen asociados.</p>
        </div>
        <div className="acciones-encabezado">
          <span className="inventario-conteo">{total} {total === 1 ? 'categoría' : 'categorías'}</span>
          {permisos.gestionarCategorias && (
            <button type="button" className="btn btn-primario" onClick={abrirAlta}>
              + Agregar categoría
            </button>
          )}
        </div>
      </div>

      <FiltrosCompras
        filtros={filtros}
        onChange={setFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        placeholder="Buscar por nombre o descripción..."
      >
        <select
          className="control"
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="todos">Estado: todos</option>
          <option value="activo">Activas</option>
          <option value="inactivo">Inactivas</option>
        </select>
      </FiltrosCompras>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando categorías...</p>
      ) : categorias.length === 0 ? (
        <p className="estado">No se encontraron categorías con los filtros aplicados.</p>
      ) : (
        <>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <ThOrdenable columna="codigo" ordenActual={orden} onOrdenar={cambiarOrden}>Código</ThOrdenable>
                  <ThOrdenable columna="nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Categoría</ThOrdenable>
                  <th>Descripción</th>
                  <ThOrdenable columna="productos" ordenActual={orden} onOrdenar={cambiarOrden}>Productos</ThOrdenable>
                  <th>Estado</th>
                  <ThOrdenable columna="creado_en" ordenActual={orden} onOrdenar={cambiarOrden}>Creada</ThOrdenable>
                  {permisos.gestionarCategorias && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.id}>
                    <td><span className="inventario-categoria-codigo">{categoria.codigo}</span></td>
                    <td><strong>{categoria.nombre}</strong></td>
                    <td><span className="inventario-categoria-descripcion">{categoria.descripcion || '—'}</span></td>
                    <td className="reporte-numero">
                      {categoria.productos > 0 ? (
                        <Link
                          to={`/inventario/productos?categoria=${categoria.id}`}
                          className="inventario-conteo-enlace"
                          title={`Ver productos de ${categoria.nombre}`}
                        >
                          {categoria.productos}
                        </Link>
                      ) : (
                        categoria.productos
                      )}
                    </td>
                    <td>
                      <span className={`chip ${categoria.activo ? 'chip-ok' : 'chip-peligro'}`}>
                        {categoria.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>{formatearFecha(categoria.creado_en)}</td>
                    {permisos.gestionarCategorias && (
                      <td className="tabla-acciones">
                        <MenuAcciones
                          acciones={[
                            { etiqueta: 'Editar', onClick: () => abrirEdicion(categoria) },
                            {
                              etiqueta: categoria.activo ? 'Inactivar' : 'Activar',
                              onClick: () => setConfirmando({ accion: 'estado', ...categoria })
                            },
                            {
                              etiqueta: 'Eliminar',
                              peligro: true,
                              deshabilitado: categoria.productos > 0,
                              titulo: categoria.productos > 0
                                ? 'Solo se puede eliminar una categoría sin productos asociados'
                                : 'Eliminar categoría',
                              onClick: () => setConfirmando({ accion: 'eliminar', ...categoria })
                            }
                          ]}
                          etiqueta={`Acciones de ${categoria.nombre}`}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={total} onCambiar={setPagina} />
        </>
      )}

      <CategoriaFormModal
        abierto={modalAbierto}
        categoria={editando}
        onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        onGuardado={alGuardar}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={confirmando?.accion === 'eliminar' ? 'Eliminar categoría' : 'Cambiar estado'}
        mensaje={
          confirmando?.accion === 'eliminar'
            ? `¿Seguro que desea eliminar la categoría "${confirmando?.nombre}"? Solo es posible si no tiene productos asociados. Esta acción no se puede deshacer.`
            : confirmando?.activo && confirmando?.productos > 0
              ? `¿Desea inactivar la categoría "${confirmando?.nombre}"? Tiene ${confirmando.productos} ${confirmando.productos === 1 ? 'producto asociado' : 'productos asociados'}; no se eliminarán, pero la categoría dejará de estar disponible para nuevas asignaciones.`
              : `¿Desea ${confirmando?.activo ? 'inactivar' : 'activar'} la categoría "${confirmando?.nombre}"?`
        }
        confirmarTexto={confirmando?.accion === 'eliminar' ? 'Eliminar' : 'Confirmar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}
