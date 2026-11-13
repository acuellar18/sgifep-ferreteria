import { datosNegocio } from '../config/negocio';

const CLAVE_CONFIG = 'sgifep.impresora';

let puerto = null;
let escritor = null;

export function impresoraSoportada() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function leerConfigImpresora() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CONFIG) || '{}');
    return {
      baudRate: Number(guardado.baudRate) || 9600,
      ancho: Number(guardado.ancho) || 42
    };
  } catch {
    return { baudRate: 9600, ancho: 42 };
  }
}

export function guardarConfigImpresora(config) {
  const actual = { ...leerConfigImpresora(), ...config };
  localStorage.setItem(CLAVE_CONFIG, JSON.stringify(actual));
  return actual;
}

function linea(izquierda, derecha, ancho) {
  const textoIzquierda = String(izquierda ?? '');
  const textoDerecha = String(derecha ?? '');
  const espacios = Math.max(1, ancho - textoIzquierda.length - textoDerecha.length);
  return `${textoIzquierda}${' '.repeat(espacios)}${textoDerecha}`;
}

function centrar(texto, ancho) {
  const valor = String(texto ?? '');
  if (valor.length >= ancho) return valor.slice(0, ancho);
  const izquierda = Math.floor((ancho - valor.length) / 2);
  return `${' '.repeat(izquierda)}${valor}`;
}

function separador(ancho, caracter = '-') {
  return caracter.repeat(ancho);
}

function formatearMoneda(valor) {
  return `Q${Number(valor || 0).toFixed(2)}`;
}

function formatearFechaHora(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guatemala'
  });
}

function recortar(texto, maximo) {
  const valor = String(texto ?? '');
  return valor.length > maximo ? `${valor.slice(0, Math.max(0, maximo - 1))}…` : valor;
}

function envolverLineas(texto, ancho) {
  const palabras = String(texto ?? '').split(/\s+/).filter(Boolean);
  const resultado = [];
  let actual = '';

  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra;
    if (candidato.length <= ancho) {
      actual = candidato;
    } else {
      if (actual) resultado.push(actual);
      actual = palabra;
    }
  }
  if (actual) resultado.push(actual);
  return resultado;
}

export function construirTicket(venta, empresa = {}) {
  const { ancho } = leerConfigImpresora();
  const lineas = [];
  const negocio = datosNegocio(empresa);

  lineas.push(centrar(negocio.nombre, ancho));
  if (negocio.direccion) lineas.push(centrar(negocio.direccion, ancho));
  if (negocio.telefono) lineas.push(centrar(`Tel: ${negocio.telefono}`, ancho));
  lineas.push(separador(ancho));

  lineas.push(linea('Ticket', venta.numero, ancho));
  if (venta.factura_numero) {
    const numeroComprobante = String(venta.factura_numero).replace(/^FAC-/, 'CMP-');
    lineas.push(linea('Comprobante', numeroComprobante, ancho));
  }
  lineas.push(linea('Fecha', formatearFechaHora(venta.creado_en), ancho));
  lineas.push(linea('Cajero', venta.usuario_nombre || '', ancho));
  lineas.push(linea('Caja', venta.caja_numero ? `Caja ${venta.caja_numero}` : '', ancho));
  lineas.push(linea('Cliente', recortar(venta.cliente_nombre || 'Consumidor Final', ancho - 8), ancho));
  if (venta.despacho_direccion) {
    lineas.push(linea('Entrega', recortar(venta.despacho_direccion, ancho - 8), ancho));
  }
  lineas.push(separador(ancho));

  for (const detalle of venta.detalles || []) {
    lineas.push(recortar(detalle.producto_nombre, ancho));
    lineas.push(
      linea(
        `  ${Number(detalle.cantidad || 0)} x ${formatearMoneda(detalle.precio_unitario)}`,
        formatearMoneda(detalle.subtotal),
        ancho
      )
    );
  }

  lineas.push(separador(ancho));
  lineas.push(linea('Subtotal', formatearMoneda(venta.subtotal), ancho));
  lineas.push(linea('IVA 12% incluido', formatearMoneda(venta.iva), ancho));
  if (Number(venta.costo_envio || 0) > 0) {
    lineas.push(linea('Envio', formatearMoneda(venta.costo_envio), ancho));
  }
  if (Number(venta.descuento || 0) > 0) {
    lineas.push(linea('Descuento', `-${formatearMoneda(venta.descuento)}`, ancho));
  }
  lineas.push(linea('TOTAL', formatearMoneda(venta.total), ancho));
  lineas.push(separador(ancho));
  const etiquetasMetodo = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    credito: 'Crédito (cuenta por cobrar)'
  };
  lineas.push(linea('Método', etiquetasMetodo[venta.metodo_pago] || venta.metodo_pago || '', ancho));
  if (venta.despacho_forma_pago === 'contra_entrega') {
    lineas.push(linea('Pago contra entrega', `${formatearMoneda(venta.total)} por cobrar`, ancho));
  }
  if (venta.referencia) lineas.push(linea('Referencia', venta.referencia, ancho));
  if (venta.estado === 'anulada') {
    lineas.push(separador(ancho, '='));
    lineas.push(centrar('VENTA ANULADA', ancho));
    lineas.push(centrar(venta.anulacion_motivo || '', ancho));
    lineas.push(separador(ancho, '='));
  }
  lineas.push('');
  lineas.push(centrar('¡Gracias por su compra!', ancho));
  lineas.push('');
  lineas.push('');
  lineas.push('');

  return lineas.join('\n');
}

async function obtenerEscritor() {
  if (escritor) return escritor;
  if (!impresoraSoportada()) {
    throw new Error('Este navegador no soporta impresión térmica por Web Serial');
  }
  if (!puerto) {
    puerto = await navigator.serial.requestPort();
  }
  if (!puerto.readable && !puerto.writable) {
    const { baudRate } = leerConfigImpresora();
    await puerto.open({ baudRate });
  }
  escritor = puerto.writable.getWriter();
  return escritor;
}

export async function imprimirTicketTermico(venta, empresa) {
  const texto = construirTicket(venta, empresa);
  const writer = await obtenerEscritor();
  const encoder = new TextEncoder();
  const inicializar = new Uint8Array([0x1b, 0x40]);
  const cortar = new Uint8Array([0x1d, 0x56, 0x42, 0x00]);

  await writer.write(inicializar);
  await writer.write(encoder.encode(`${texto}\n`));
  await writer.write(cortar);
  writer.releaseLock();
  escritor = null;
}

export async function desconectarImpresora() {
  try {
    if (escritor) {
      escritor.releaseLock();
      escritor = null;
    }
    if (puerto) {
      await puerto.close();
      puerto = null;
    }
  } catch {
    puerto = null;
    escritor = null;
  }
}
