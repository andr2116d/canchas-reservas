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

const CLAVE_CIERRE = "la-previa:sesion-cerrada";

export type MotivoCierre = "manual" | "inactividad";

export const DESTINO_CIERRE: Record<MotivoCierre, string> = {
  manual: "/login",
  inactividad: "/login?motivo=inactividad",
};

function leerMotivo(valor: string): MotivoCierre | null {
  try {
    const { motivo } = JSON.parse(valor);
    return Object.hasOwn(DESTINO_CIERRE, motivo) ? motivo : null;
  } catch {
    return null;
  }
}

export function avisarCierre(motivo: MotivoCierre) {
  try {
    localStorage.setItem(CLAVE_CIERRE, JSON.stringify({ motivo, en: Date.now() }));
  } catch {}
}

export function escucharCierre(alCerrar: (motivo: MotivoCierre) => void) {
  const alCambiar = (evento: StorageEvent) => {
    if (evento.key !== CLAVE_CIERRE || !evento.newValue) return;
    const motivo = leerMotivo(evento.newValue);
    if (motivo) alCerrar(motivo);
  };
  window.addEventListener("storage", alCambiar);
  return () => window.removeEventListener("storage", alCambiar);
}
