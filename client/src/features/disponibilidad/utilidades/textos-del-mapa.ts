import type { EstadoDelTurno, TurnoDelMapa } from "../servicios/disponibilidad";

/** Lo que dice cada celda del mapa. */
export const TEXTO_DEL_ESTADO: Record<EstadoDelTurno, string> = {
  DISPONIBLE: "Libre",
  PENDIENTE: "Pendiente",
  OCUPADO: "Ocupado",
  MANTENIMIENTO: "Mantenimiento",
  SIN_LUZ: "Sin luz",
  YA_EMPEZO: "Ya empezó",
};

/** Título del grupo de turnos de cada franja. */
export function textoDeLaFranja(franja: TurnoDelMapa["franja"], inicioDeLaNoche: string): string {
  if (franja === "DIA") return "De día";
  if (franja === "NOCHE") return `De noche · desde las ${inicioDeLaNoche}`;
  return "Empieza de día y termina de noche";
}

