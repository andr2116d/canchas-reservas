import type { HorarioDelDia } from './horario-del-dia';

/** Un sobrante de menos de esto nunca se ofrece como turno. */
export const MINUTOS_MINIMOS_DEL_TURNO_CORTO = 30;

/** Rango del día en minutos desde la medianoche. */
export interface Rango {
  desde: number;
  hasta: number;
}

export interface Turno extends Rango {
  /** El rato final ofrecido aunque no alcance para un turno completo. */
  corto: boolean;
}

export interface TurnosDelDia {
  turnos: Turno[];
  /** Rato al final del día que no se ofrece. */
  sinTurno?: Rango;
}

/**
 * Turnos seguidos desde la apertura con la duración del tipo de cancha. El rato
 * final que no alcanza para un turno completo se ofrece como turno corto solo si
 * el tipo lo permite y dura al menos el mínimo; si no, se informa como rato sin turno.
 */
export function generarTurnos(
  dia: HorarioDelDia,
  minutosDelTurno: number,
  ofreceTurnoCorto: boolean,
): TurnosDelDia {
  const cierre = dia.cierra.minutos;
  const turnos: Turno[] = [];
  let inicio = dia.abre.minutos;
  for (; inicio + minutosDelTurno <= cierre; inicio += minutosDelTurno) {
    turnos.push({
      desde: inicio,
      hasta: inicio + minutosDelTurno,
      corto: false,
    });
  }
  const sobrante = cierre - inicio;
  if (sobrante === 0) return { turnos };
  if (ofreceTurnoCorto && sobrante >= MINUTOS_MINIMOS_DEL_TURNO_CORTO) {
    return {
      turnos: [...turnos, { desde: inicio, hasta: cierre, corto: true }],
    };
  }
  return { turnos, sinTurno: { desde: inicio, hasta: cierre } };
}
