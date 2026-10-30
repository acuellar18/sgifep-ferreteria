import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const FORMATOS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE
];

const CONFIG_LECTOR = {
  formatsToSupport: FORMATOS,
  useBarCodeDetectorIfSupported: false,
  verbose: false
};

const MODOS = [
  { id: 'camara', etiqueta: 'Cámara' },
  { id: 'imagen', etiqueta: 'Subir imagen' },
  { id: 'manual', etiqueta: 'Manual' }
];

function mensajeDeError(error) {
  const nombre = error?.name || error?.code || '';
  if (nombre === 'NotAllowedError' || nombre === 'PermissionDeniedError') {
    return 'Permiso de cámara denegado. Habilítalo en el navegador o usa la imagen o el ingreso manual.';
  }
  if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError') {
    return 'No se encontró ninguna cámara disponible en este dispositivo.';
  }
  if (nombre === 'NotReadableError' || nombre === 'TrackStartError') {
    return 'La cámara está en uso por otra aplicación. Ciérrala e intenta de nuevo.';
  }
  if (nombre === 'OverconstrainedError') {
    return 'La cámara seleccionada no está disponible. Prueba con otra cámara.';
  }
  return 'No se pudo iniciar la cámara. Revisa los permisos o usa la imagen o el ingreso manual.';
}

function elegirCamara(dispositivos) {
  const trasera = dispositivos.find((camara) => /back|rear|trasera|environment/i.test(camara.label || ''));
  if (trasera) return trasera.id;
  if (dispositivos.length > 1) return dispositivos[dispositivos.length - 1].id;
  return dispositivos[0]?.id || '';
}

function reproducirAviso() {
  try {
    navigator.vibrate?.(80);
  } catch {
    // La vibración es opcional.
  }
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const contexto = new AudioCtx();
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.value = 880;
    ganancia.gain.setValueAtTime(0.07, contexto.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + 0.12);
    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.13);
    oscilador.onended = () => contexto.close?.().catch(() => {});
  } catch {
    // Si el navegador bloquea el audio, la lectura continúa.
  }
}

function cargarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => resolve({ imagen, url });
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo abrir la imagen'));
    };
    imagen.src = url;
  });
}

async function reducirImagen(archivo) {
  const { imagen, url } = await cargarImagen(archivo);
  const ladoMayor = Math.max(imagen.naturalWidth, imagen.naturalHeight);
  const limite = 1600;

  if (ladoMayor <= limite) {
    URL.revokeObjectURL(url);
    return archivo;
  }

  const escala = limite / ladoMayor;
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.naturalWidth * escala);
  lienzo.height = Math.round(imagen.naturalHeight * escala);
  const contexto = lienzo.getContext('2d');
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  URL.revokeObjectURL(url);

  const blob = await new Promise((resolve) => lienzo.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) return archivo;
  return new File([blob], 'codigo.jpg', { type: 'image/jpeg' });
}

export default function BarcodeScanner({ onDetectar, deshabilitado = false }) {
  const idBase = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const idCamara = `barcode-camara-${idBase}`;
  const idArchivo = `barcode-archivo-${idBase}`;

  const lectorRef = useRef(null);
  const lectorArchivoRef = useRef(null);
  const ultimoRef = useRef({ codigo: '', fecha: 0 });
  const emitiendoRef = useRef(false);

  const [modo, setModo] = useState('camara');
  const [camaras, setCamaras] = useState([]);
  const [camaraId, setCamaraId] = useState('');
  const [iniciando, setIniciando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const soportado = typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => () => {
    const lector = lectorRef.current;
    if (lector) {
      lector.stop?.().catch(() => {});
    }
    const lectorArchivo = lectorArchivoRef.current;
    if (lectorArchivo) {
      try {
        lectorArchivo.clear();
      } catch {
        // Limpieza best-effort al desmontar.
      }
    }
  }, []);

  function obtenerLector() {
    if (!lectorRef.current) {
      lectorRef.current = new Html5Qrcode(idCamara, CONFIG_LECTOR);
    }
    return lectorRef.current;
  }

  function obtenerLectorArchivo() {
    if (!lectorArchivoRef.current) {
      lectorArchivoRef.current = new Html5Qrcode(idArchivo, CONFIG_LECTOR);
    }
    return lectorArchivoRef.current;
  }

  async function detenerCamara() {
    const lector = lectorRef.current;
    if (!lector) {
      setEscaneando(false);
      return;
    }
    try {
      if (lector.isScanning) await lector.stop();
    } catch {
      // El stream ya pudo haberse liberado.
    }
    try {
      lector.clear();
    } catch {
      // Limpieza best-effort.
    }
    lectorRef.current = null;
    setEscaneando(false);
  }

  function emitirCodigo(texto, detener = true) {
    const codigo = String(texto || '').trim();
    if (!codigo) return;
    const ahora = Date.now();
    if (emitiendoRef.current) return;
    if (ultimoRef.current.codigo === codigo && ahora - ultimoRef.current.fecha < 2000) return;

    emitiendoRef.current = true;
    ultimoRef.current = { codigo, fecha: ahora };
    setMensaje(`Código detectado: ${codigo}`);
    setError('');
    reproducirAviso();

    Promise.resolve(onDetectar?.(codigo)).finally(() => {
      emitiendoRef.current = false;
      if (detener) detenerCamara();
    });
  }

  async function iniciarCamara(idElegido) {
    setError('');
    setMensaje('');

    if (!window.isSecureContext) {
      setError('La cámara solo funciona en localhost o HTTPS. Usa la imagen o el ingreso manual.');
      return;
    }
    if (!soportado) {
      setError('Este navegador no permite acceder a la cámara. Usa la imagen o el ingreso manual.');
      return;
    }

    setIniciando(true);
    try {
      let dispositivos = camaras;
      if (!dispositivos.length) {
        dispositivos = await Html5Qrcode.getCameras();
        setCamaras(dispositivos);
      }
      if (!dispositivos.length) {
        setError('No se encontró ninguna cámara disponible en este dispositivo.');
        return;
      }

      const elegida = idElegido || camaraId || elegirCamara(dispositivos);
      setCamaraId(elegida);
      const lector = obtenerLector();
      await lector.start(
        elegida,
        {
          fps: 10,
          qrbox: { width: 260, height: 170 },
          aspectRatio: 1.4,
          disableFlip: true
        },
        (texto) => emitirCodigo(texto),
        () => {}
      );
      setEscaneando(true);
    } catch (err) {
      setError(mensajeDeError(err));
      await detenerCamara();
    } finally {
      setIniciando(false);
    }
  }

  async function cambiarCamara(evento) {
    const id = evento.target.value;
    setCamaraId(id);
    if (escaneando) {
      await detenerCamara();
      await iniciarCamara(id);
    }
  }

  async function cambiarModo(nuevoModo) {
    if (nuevoModo === modo) return;
    if (modo === 'camara') await detenerCamara();
    setModo(nuevoModo);
    setError('');
    setMensaje('');
  }

  async function leerImagen(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen (JPG, PNG o WebP).');
      return;
    }

    setProcesandoImagen(true);
    setError('');
    setMensaje('');
    try {
      const archivoListo = await reducirImagen(archivo);
      const lector = obtenerLectorArchivo();
      const resultado = await lector.scanFileV2(archivoListo, false);
      emitirCodigo(resultado.decodedText, false);
    } catch {
      setError('No se encontró un código legible en la imagen. Prueba con una foto más nítida o usa el ingreso manual.');
    } finally {
      setProcesandoImagen(false);
    }
  }

  function agregarManual(evento) {
    evento.preventDefault();
    const codigo = manual.trim();
    if (!codigo) {
      setError('Escribe un código antes de agregarlo.');
      return;
    }
    emitirCodigo(codigo, false);
    setManual('');
  }

  return (
    <div className="barcode-scanner">
      <div className="barcode-pestanas" role="tablist" aria-label="Método de lectura">
        {MODOS.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            role="tab"
            aria-selected={modo === opcion.id}
            className={`barcode-pestana${modo === opcion.id ? ' activa' : ''}`}
            onClick={() => cambiarModo(opcion.id)}
            disabled={deshabilitado}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>

      {modo === 'camara' && (
        <div className="barcode-panel">
          <div className="barcode-controles">
            {escaneando ? (
              <button type="button" className="btn btn-secundario" onClick={detenerCamara}>
                Detener
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => iniciarCamara()}
                disabled={deshabilitado || iniciando}
              >
                {iniciando ? 'Iniciando...' : 'Usar cámara'}
              </button>
            )}

            {camaras.length > 1 && (
              <select
                className="control barcode-selector-camara"
                value={camaraId}
                onChange={cambiarCamara}
                disabled={deshabilitado || iniciando}
                aria-label="Seleccionar cámara"
              >
                {camaras.map((camara, indice) => (
                  <option key={camara.id} value={camara.id}>
                    {camara.label || `Cámara ${indice + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div id={idCamara} className="barcode-video" />

          <p className="barcode-ayuda">
            Apunta al código de barras o QR. La cámara se detiene sola al detectarlo.
          </p>
        </div>
      )}

      {modo === 'imagen' && (
        <div className="barcode-panel">
          <label className="barcode-archivo-label">
            <span>Imagen del código</span>
            <input
              type="file"
              accept="image/*"
              onChange={leerImagen}
              disabled={deshabilitado || procesandoImagen}
            />
          </label>
          <p className="barcode-ayuda">
            {procesandoImagen
              ? 'Analizando la imagen...'
              : 'Selecciona o toma una foto donde se vea completo el código.'}
          </p>
        </div>
      )}

      {modo === 'manual' && (
        <form className="barcode-panel barcode-manual" onSubmit={agregarManual}>
          <label className="campo">
            <span>Código de barras</span>
            <input
              type="text"
              className="control"
              value={manual}
              onChange={(evento) => setManual(evento.target.value)}
              placeholder="Escribe el código y presiona Agregar"
              inputMode="numeric"
              disabled={deshabilitado}
            />
          </label>
          <button type="submit" className="btn btn-primario" disabled={deshabilitado}>
            Agregar
          </button>
        </form>
      )}

      {error && <p className="barcode-error">{error}</p>}
      {mensaje && !error && <p className="barcode-exito">{mensaje}</p>}

      <div id={idArchivo} className="barcode-archivo-oculto" aria-hidden="true" />
    </div>
  );
}
