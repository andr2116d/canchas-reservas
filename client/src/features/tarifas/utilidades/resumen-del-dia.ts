import { horaDe, minutosDe, type VistaDelDia } from "@/compartido/horario/horario";

// La misma regla del server: un sobrante de menos de esto nunca se ofrece.
const MINUTOS_MINIMOS_DEL_TURNO_CORTO = 30;

interface RangoEnTexto {
  desde: string;
  hasta: string;
}

export interface ResumenDelDia {
  turnos: number;
  /** Rato final ofrecido como turno corto. */
  corto?: RangoEnTexto;
  /** Rato final que no se ofrece. */
  sinTurno?: RangoEnTexto;
}

/** Cuántos turnos completos salen en el día y qué pasa con el rato final; nada si está cerrado. */
export function resumenDelDia(dia: VistaDelDia, minutosDelTurno: number, ofreceTurnoCorto: boolean): ResumenDelDia | undefined {
  if (!dia.abierto || !dia.abre || !dia.cierra) return undefined;
  const apertura = minutosDe(dia.abre);
  const cierre = minutosDe(dia.cierra);
  const turnos = Math.floor((cierre - apertura) / minutosDelTurno);
  const finDelUltimo = apertura + turnos * minutosDelTurno;
  if (finDelUltimo === cierre) return { turnos };
  const rato = { desde: horaDe(finDelUltimo), hasta: horaDe(cierre) };
  const sobrante = cierre - finDelUltimo;
  return ofreceTurnoCorto && sobrante >= MINUTOS_MINIMOS_DEL_TURNO_CORTO ? { turnos, corto: rato } : { turnos, sinTurno: rato };
}
