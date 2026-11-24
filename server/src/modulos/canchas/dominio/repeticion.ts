import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import {
  fechaEnLima,
  leerFecha,
  sumarAFecha,
} from '../../../compartido/dominio/momento-en-lima';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

export type Frecuencia = 'DIARIA' | 'SEMANAL' | 'MENSUAL';

/** Cada cuánto se repite un bloqueo y hasta qué fecha de Lima, incluida. */
export interface Repeticion {
  frecuencia: string;
  hasta: string;
}

export interface Rango {
  inicio: Date;
  fin: Date;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const MESES_COMO_MAXIMO = 12;

const PASO: Record<
  Frecuencia,
  { dias?: number; meses?: number; duracionMaxima: number; mensaje: string }
> = {
  DIARIA: {
    dias: 1,
    duracionMaxima: MS_POR_DIA,
    mensaje: 'Para repetir cada día, el bloqueo debe durar menos de un día.',
  },
  SEMANAL: {
    dias: 7,
    duracionMaxima: 7 * MS_POR_DIA,
    mensaje:
      'Para repetir cada semana, el bloqueo debe durar menos de una semana.',
  },
  MENSUAL: {
    meses: 1,
    duracionMaxima: 28 * MS_POR_DIA,
    mensaje: 'Para repetir cada mes, el bloqueo debe durar menos de 28 días.',
  },
};

const rechazar = (mensaje: string): never => {
  throw new ReglaInvalidaError({ repeticion: mensaje });
};

function leerHasta(texto: string): string {
  try {
    return leerFecha(texto);
  } catch (error) {
    if (error instanceof ValorInvalidoError)
      return rechazar('Elige hasta qué fecha se repite.');
    throw error;
  }
}

/**
 * El primer rango y sus repeticiones, cada una a la misma hora de Lima. Cada
 * mes usa el mismo día que el primero; si un mes no lo tiene, el último.
 */
export function rangosDelBloqueo(
  primero: Rango,
  repeticion?: Repeticion,
): Rango[] {
  if (!repeticion) return [primero];
  const paso =
    PASO[repeticion.frecuencia as Frecuencia] ??
    rechazar('Elige cada cuánto se repite.');
  const hasta = leerHasta(repeticion.hasta);
  const fechaInicial = fechaEnLima(primero.inicio);
  const duracion = primero.fin.getTime() - primero.inicio.getTime();
  if (hasta <= fechaInicial)
    rechazar('Elige una fecha final posterior al primer bloqueo.');
  if (hasta > sumarAFecha(fechaInicial, { meses: MESES_COMO_MAXIMO }))
    rechazar('Repite como máximo por un año.');
  if (duracion >= paso.duracionMaxima) rechazar(paso.mensaje);
  const rangos: Rango[] = [];
  for (let vez = 0; ; vez++) {
    const fecha = sumarAFecha(fechaInicial, {
      dias: (paso.dias ?? 0) * vez,
      meses: (paso.meses ?? 0) * vez,
    });
    if (fecha > hasta) return rangos;
    const corrimiento =
      Date.parse(`${fecha}T00:00:00Z`) -
      Date.parse(`${fechaInicial}T00:00:00Z`);
    const inicio = new Date(primero.inicio.getTime() + corrimiento);
    rangos.push({ inicio, fin: new Date(inicio.getTime() + duracion) });
  }
}
