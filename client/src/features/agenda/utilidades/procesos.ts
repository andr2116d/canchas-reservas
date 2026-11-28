import type { AccionDeLaAgenda } from "../servicios/agenda";

export interface ProcesoDeLaAgenda {
  texto: string;
  ruta: (codigo: string) => string;
}

/**
 * Dónde se hace cada acción. La agenda solo enlaza: la lógica vive en su proceso.
 * Una acción aparece en la agenda cuando su proceso se agrega aquí.
 */
export const PROCESOS_DE_LA_AGENDA: Partial<Record<AccionDeLaAgenda, ProcesoDeLaAgenda>> = {};

/** Los procesos que el estado permite y que ya existen, en el orden que dio el server. */
export function procesosDisponibles(acciones: AccionDeLaAgenda[]): ProcesoDeLaAgenda[] {
  return acciones.flatMap((accion) => {
    const proceso = PROCESOS_DE_LA_AGENDA[accion];
    return proceso ? [proceso] : [];
  });
}
