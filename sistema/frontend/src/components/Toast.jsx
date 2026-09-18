import { createContext, useCallback, useContext, useRef, useState } from 'react';

// Sistema de notificaciones (toast) reutilizable en todos los módulos.
//
// Uso en un módulo cualquiera:
//   const notificar = useNotificacion();
//   notificar.exito('Usuario creado correctamente');
//   notificar.error('No se pudo eliminar el usuario');
//
// El <ToastProvider> se monta UNA sola vez en Layout.jsx (o App.jsx) para
// que cualquier página pueda usar el hook sin repetir el contenedor visual.
const ToastContext = createContext(null);

let idAutoincremental = 0;

export function ToastProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const temporizadores = useRef({});

  const quitar = useCallback((id) => {
    setNotificaciones((actuales) => actuales.filter((n) => n.id !== id));
    clearTimeout(temporizadores.current[id]);
    delete temporizadores.current[id];
  }, []);

  const notificar = useCallback(
    (mensaje, tipo = 'exito', duracionMs = 4000) => {
      idAutoincremental += 1;
      const id = idAutoincremental;
      setNotificaciones((actuales) => [...actuales, { id, mensaje, tipo }]);
      temporizadores.current[id] = setTimeout(() => quitar(id), duracionMs);
    },
    [quitar]
  );

  const valor = {
    exito: (mensaje, duracionMs) => notificar(mensaje, 'exito', duracionMs),
    error: (mensaje, duracionMs) => notificar(mensaje, 'error', duracionMs)
  };

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast-contenedor" aria-live="polite">
        {notificaciones.map((n) => (
          <div key={n.id} className={`toast toast-${n.tipo}`}>
            <span>{n.mensaje}</span>
            <button
              type="button"
              className="toast-cerrar"
              onClick={() => quitar(n.id)}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook que usan las páginas. Si algún módulo se monta fuera del
// ToastProvider por error, cae a console.* para no romper la UI.
export function useNotificacion() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    return {
      exito: (msg) => console.log('[toast:exito]', msg),
      error: (msg) => console.error('[toast:error]', msg)
    };
  }
  return contexto;
}
