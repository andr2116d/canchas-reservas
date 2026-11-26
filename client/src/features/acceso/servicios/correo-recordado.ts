const CLAVE_CORREO = "la-previa:correo-de-acceso";

export function obtenerCorreoRecordado(): string | null {
  try {
    return localStorage.getItem(CLAVE_CORREO);
  } catch {
    return null;
  }
}

export function guardarCorreoRecordado(correo?: string): void {
  try {
    if (correo) localStorage.setItem(CLAVE_CORREO, correo);
    else localStorage.removeItem(CLAVE_CORREO);
  } catch {
    // Recordar el correo es opcional en navegadores que bloquean el almacenamiento.
  }
}
