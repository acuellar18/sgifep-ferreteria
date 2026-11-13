const CLAVE_TEMA = 'sgifep.tema';
const TEMAS = ['claro', 'oscuro'];

// Lee el tema guardado por el usuario (por defecto, claro institucional).
export function leerTema() {
  try {
    return TEMAS.includes(localStorage.getItem(CLAVE_TEMA)) ? localStorage.getItem(CLAVE_TEMA) : 'claro';
  } catch {
    return 'claro';
  }
}

// Aplica el tema al documento y lo persiste. Devuelve el tema aplicado.
export function aplicarTema(tema) {
  const valor = TEMAS.includes(tema) ? tema : 'claro';
  try {
    localStorage.setItem(CLAVE_TEMA, valor);
  } catch {
    // Sin localStorage disponible, el tema solo vive en esta página.
  }
  document.documentElement.dataset.tema = valor;
  return valor;
}

// Se llama al arrancar la app para evitar parpadeo de tema incorrecto.
export function inicializarTema() {
  return aplicarTema(leerTema());
}
