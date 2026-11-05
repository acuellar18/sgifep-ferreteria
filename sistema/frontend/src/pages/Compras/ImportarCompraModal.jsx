import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../../components/Modal';
import api from '../../services/api';

// Límite de filas por archivo de importación
const LIMITE_FILAS = 500;

const CABECERAS_PLANTILLA = [
  'Producto',
  'Cantidad',
  'Precio compra (sin IVA)',
  'Precio venta',
  'Categoría',
  'Presentación',
  'Código de barra',
  'Ubicación',
  'Descripción'
];

const FILA_EJEMPLO = [
  'Clavo 2 pulgadas',
  5,
  12.5,
  18,
  'Ferretería General',
  'CAJA',
  '748102938475',
  'Pasillo 3',
  'Caja con 500 g de clavos'
];

// Normaliza para comparar: sin acentos/diéresis (NFD), minúsculas y espacios colapsados
function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function aNumero(valor) {
  if (typeof valor === 'number') return valor;
  const texto = String(valor ?? '').trim().replace(/[^0-9.,-]/g, '').replace(/,(\d{3})(?!\d)/g, '$1').replace(',', '.');
  if (!texto) return NaN;
  return Number(texto);
}

function descargarPlantilla() {
  const hoja = XLSX.utils.aoa_to_sheet([CABECERAS_PLANTILLA, FILA_EJEMPLO]);
  hoja['!cols'] = CABECERAS_PLANTILLA.map((c, i) => ({ wch: i === 0 ? 30 : 12 }));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Compra');
  XLSX.writeFile(libro, 'plantilla_compra.xlsx');
}

// Encuentra los índices de columna según los encabezados con nombres flexibles
function ubicarColumnas(cabecera) {
  const claves = cabecera.map((c) => normalizar(c));
  function buscar(alternativas) {
    for (const alt of alternativas) {
      const idx = claves.findIndex((c) => c === alt || c.startsWith(alt));
      if (idx >= 0) return idx;
    }
    return -1;
  }
  return {
    nombre: buscar(['producto', 'nombre producto', 'nombre']),
    cantidad: buscar(['cantidad']),
    precio_compra: buscar(['precio de compra', 'precio compra']),
    precio_venta: buscar(['precio de venta', 'precio venta']),
    categoria: buscar(['categoria']),
    presentacion: buscar(['presentacion']),
    codigo_barras: buscar(['codigo de barra', 'codigo de barras', 'codigo barra']),
    ubicacion: buscar(['ubicacion']),
    descripcion: buscar(['descripcion'])
  };
}

function valorCelda(fila, idx) {
  if (idx < 0) return '';
  const valor = fila[idx];
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

export default function ImportarCompraModal({
  abierto,
  categorias = [],
  onCerrar,
  onAceptar
}) {
  const [productos, setProductos] = useState(null);
  const [filas, setFilas] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [cargandoProductos, setCargandoProductos] = useState(false);

  useEffect(() => {
    if (!abierto) {
      setFilas(null);
      setMensaje('');
      setNombreArchivo('');
      return undefined;
    }
    setProductos(null);
    setFilas(null);
    setMensaje('');
    setNombreArchivo('');
    let cancelar = false;
    setCargandoProductos(true);
    cargarProductos().then((lista) => {
      if (!cancelar) setProductos(lista);
    }).catch(() => {
      if (!cancelar) setMensaje('No se pudo cargar la lista de productos para vincular nombres. Intente nuevamente.');
    }).finally(() => {
      if (!cancelar) setCargandoProductos(false);
    });
    return () => { cancelar = true; };
  }, [abierto]);

  async function cargarProductos() {
    const lista = [];
    let continuar = true;
    let total = Infinity;
    for (let page = 1; continuar && page <= 25; page++) {
      const res = await api.get('/productos', { params: { page, pageSize: 100, estado: 'activo' } });
      lista.push(...(res.data || []));
      total = Number(res.total || 0);
      continuar = lista.length < total;
    }
    return lista;
  }

  function leerArchivo(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    if (!/\.(xlsx|xls)$/i.test(archivo.name)) {
      setMensaje('El archivo debe ser .xlsx o .xls');
      setFilas(null);
      return;
    }
    archivo.arrayBuffer().then((buffer) => {
      const libro = XLSX.read(buffer, { type: 'array' });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      if (!hoja) {
        setMensaje('El archivo no tiene hojas con datos.');
        setFilas(null);
        return;
      }
      const matriz = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: true });
      procesarMatriz(matriz, archivo.name);
    }).catch(() => {
      setMensaje('No se pudo leer el archivo. Verifique que sea un Excel válido.');
      setFilas(null);
    });
  }

  function procesarMatriz(matriz, nombre) {
    // Encuentra la fila de encabezados (la que contiene "producto")
    const indiceCabecera = matriz.findIndex((fila) =>
      fila.some((c) => normalizar(String(c ?? '')) === 'producto' || normalizar(String(c ?? '')).startsWith('nombre producto'))
    );
    if (indiceCabecera < 0) {
      setMensaje('No se encontró la fila de encabezados. Debe existir una columna "Producto".');
      setFilas(null);
      return;
    }
    const columnas = ubicarColumnas(matriz[indiceCabecera]);
    if (columnas.nombre < 0 || columnas.cantidad < 0 || columnas.precio_compra < 0 || columnas.precio_venta < 0) {
      setMensaje('Faltan columnas obligatorias: Producto, Cantidad, Precio compra (sin IVA) y Precio venta.');
      setFilas(null);
      return;
    }
    const registros = [];
    for (let i = indiceCabecera + 1; i < matriz.length; i++) {
      const fila = matriz[i];
      if (!fila || fila.every((c) => String(c ?? '').trim() === '')) continue;
      registros.push({
        nombre: valorCelda(fila, columnas.nombre),
        cantidad: valorCelda(fila, columnas.cantidad),
        precio_compra: valorCelda(fila, columnas.precio_compra),
        precio_venta: valorCelda(fila, columnas.precio_venta),
        categoria: valorCelda(fila, columnas.categoria),
        presentacion: valorCelda(fila, columnas.presentacion),
        codigo_barras: valorCelda(fila, columnas.codigo_barras),
        ubicacion: valorCelda(fila, columnas.ubicacion),
        descripcion: valorCelda(fila, columnas.descripcion)
      });
    }
    if (registros.length === 0) {
      setMensaje('El archivo no contiene filas de productos.');
      setFilas(null);
      return;
    }
    if (registros.length > LIMITE_FILAS) {
      setMensaje(`El archivo tiene ${registros.length} filas y supera el límite de ${LIMITE_FILAS}. Divida la compra en varios archivos.`);
      setFilas(null);
      return;
    }
    setNombreArchivo(nombre);
    setMensaje('');
    setFilas(validarFilas(registros, categorias, productos || []));
  }

  function validarFilas(registros, listaCategorias, listaProductos) {
    const categoriasPorClave = new Map(listaCategorias.map((c) => [normalizar(c.nombre), c]));
    const productosPorClave = new Map(listaProductos.map((p) => [normalizar(p.nombre), p]));
    const barraUsadaPorProducto = new Map(
      listaProductos
        .filter((p) => String(p.codigo_barras || '').trim())
        .map((p) => [String(p.codigo_barras).trim().toLowerCase(), p])
    );
    const conteoNombres = new Map();
    registros.forEach((r) => {
      const clave = normalizar(r.nombre);
      conteoNombres.set(clave, (conteoNombres.get(clave) || 0) + 1);
    });

    const barraVista = new Map();
    return registros.map((r) => {
      const errores = [];
      const nombre = r.nombre;
      const producto = productosPorClave.get(normalizar(nombre)) || null;
      const esNueva = !producto;

      const cantidad = aNumero(r.cantidad);
      if (!r.cantidad || !Number.isFinite(cantidad) || cantidad <= 0) {
        errores.push('Cantidad debe ser un número mayor a 0');
      }

      const precioCompra = aNumero(r.precio_compra);
      if (!r.precio_compra || !Number.isFinite(precioCompra) || precioCompra <= 0) {
        errores.push('Precio de compra no es un número mayor a 0');
      }

      const precioVenta = aNumero(r.precio_venta);
      if (!r.precio_venta || !Number.isFinite(precioVenta) || precioVenta < 0) {
        errores.push('Precio venta no es un número válido');
      } else if (Number.isFinite(precioCompra) && precioCompra > 0 && precioVenta < precioCompra) {
        errores.push('Precio venta menor al precio de compra');
      }

      let categoriaResuelta = null;
      if (esNueva) {
        const nombreCat = r.categoria;
        if (!nombreCat) {
          errores.push('Categoría faltante para producto nuevo');
        } else {
          categoriaResuelta = categoriasPorClave.get(normalizar(nombreCat)) || null;
          if (!categoriaResuelta) {
            errores.push(`Categoría "${nombreCat}" no existe en el sistema`);
          }
        }
        if (!r.presentacion) {
          errores.push('Presentación faltante para producto nuevo');
        }
      }

      const barra = r.codigo_barras;
      if (barra) {
        if (!producto && barraUsadaPorProducto.has(barra.toLowerCase())) {
          errores.push(`Código de barra ya lo usa "${barraUsadaPorProducto.get(barra.toLowerCase()).nombre}"`);
        }
        if (!producto && barraVista.has(barra.toLowerCase())) {
          errores.push('Código de barra duplicado en el archivo');
        }
        barraVista.set(barra.toLowerCase(), true);
      }

      if (esNueva && nombre && (conteoNombres.get(normalizar(nombre)) || 0) > 1) {
        errores.push('Nombre de producto repetido dentro del archivo');
      }

      return {
        ...r,
        categoria_resuelta: categoriaResuelta,
        producto,
        con_error: errores.length > 0,
        errores
      };
    });
  }

  const filasUtiles = (filas || []).filter((f) => !f.con_error);
  const filasConError = (filas || []).filter((f) => f.con_error);

  return (
    <Modal abierto={abierto} titulo="Importar líneas desde Excel" onCerrar={onCerrar} ancho="980px">
      <p className="importar-ayuda">
        Un archivo equivale a una compra de un solo proveedor. Elija el proveedor, fecha, factura y condición en la
        pantalla principal; aquí solo se cargan los productos. El nombre del producto debe coincidir con uno existente
        o se creará como producto nuevo (requiere categoría y presentación).
      </p>

      <div className="importar-barra">
        <button type="button" className="btn btn-secundario" onClick={descargarPlantilla}>
          Descargar plantilla
        </button>
        <label className={`btn btn-primario${productos ? '' : ' btn-deshabilitado'}`}>
          Elegir archivo .xlsx / .xls
          <input type="file" accept=".xlsx,.xls" disabled={!productos} onChange={leerArchivo} hidden />
        </label>
        {cargandoProductos && <span className="importar-cargando">Cargando productos del sistema…</span>}
        {nombreArchivo && !cargandoProductos && (
          <span className="importar-archivo">
            {nombreArchivo}: {filasUtiles.length} fila(s) listas, {filasConError.length} con error
          </span>
        )}
      </div>

      {mensaje && <div className="alerta alerta-error">{mensaje}</div>}

      {filas && (
        <>
          <div className="tabla-contenedor importar-preview">
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio compra</th>
                  <th>Precio venta</th>
                  <th>Categoría</th>
                  <th>Presentación</th>
                  <th>Código de barra</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} className={f.con_error ? 'importar-fila-error' : 'importar-fila-ok'}>
                    <td>{i + 1}</td>
                    <td>{f.nombre || '—'}</td>
                    <td>{f.cantidad || '—'}</td>
                    <td>{f.precio_compra || '—'}</td>
                    <td>{f.precio_venta || '—'}</td>
                    <td>{f.categoria || '—'}</td>
                    <td>{f.presentacion || '—'}</td>
                    <td>{f.codigo_barras || '—'}</td>
                    <td>
                      {f.con_error ? (
                        <ul className="importar-motivos">
                          {f.errores.map((e, j) => <li key={j}>{e}</li>)}
                        </ul>
                      ) : (
                        <span className="importar-estado-ok">Lista</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="importar-resultado">
            {filasConError.length > 0
              ? `Las filas con errores NO se cargarán. Corríjalas en el Excel o edite las líneas después de cargar.`
              : `Todas las filas se pueden cargar.`}
          </p>

          <div className="importar-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => { setFilas(null); setNombreArchivo(''); }}>
              Elegir otro archivo
            </button>
            <button
              type="button"
              className="btn btn-primario"
              disabled={filasUtiles.length === 0}
              onClick={() => onAceptar(
                filasUtiles.map((f) => ({
                  nombre: f.nombre,
                  cantidad: aNumero(f.cantidad),
                  precio_compra: aNumero(f.precio_compra),
                  precio_venta: aNumero(f.precio_venta),
                  categoria: f.categoria_resuelta,
                  presentacion: f.presentacion,
                  codigo_barras: f.codigo_barras,
                  ubicacion: f.ubicacion,
                  descripcion: f.descripcion,
                  producto: f.producto
                }))
              )}
            >
              {`Cargar ${filasUtiles.length} línea(s)`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
