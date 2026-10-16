const CLAVE_ACTIVIDAD = "la-previa:actividad";

export function registrarActividad(instante: number) {
  try {
    localStorage.setItem(CLAVE_ACTIVIDAD, String(instante));
  } catch {}
}

export function leerUltimaActividad(): number {
  try {
    const instante = Number(localStorage.getItem(CLAVE_ACTIVIDAD));
    return Number.isFinite(instante) ? instante : 0;
  } catch {
    return 0;
  }
}
