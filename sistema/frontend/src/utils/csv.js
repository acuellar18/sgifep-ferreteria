// Genera y descarga un archivo CSV a partir de un arreglo de objetos.
export default function exportarCSV(filas, nombreArchivo = 'datos.csv') {
  if (!filas || filas.length === 0) return false;

  const encabezados = Object.keys(filas[0]);
  const escapar = (valor) => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    return `"${texto.replace(/"/g, '""')}"`;
  };

  const lineas = [
    encabezados.join(','),
    ...filas.map((fila) => encabezados.map((col) => escapar(fila[col])).join(','))
  ];

  const blob = new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
  return true;
}