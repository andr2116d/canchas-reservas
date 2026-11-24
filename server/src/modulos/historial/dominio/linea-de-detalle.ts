import {
  esTipoDeCancha,
  NOMBRE_DEL_TIPO,
} from '../../../compartido/dominio/tipo-de-cancha';

/** Un dato que cambió, con su valor anterior y el nuevo ya escritos para leerse. */
export interface LineaDeDetalle {
  campo: string;
  antes: string | null;
  despues: string | null;
}

/** Una línea por cada campo cuyo texto cambió; en un alta, `antes` es nulo. */
export function lineasQueCambian<T>(
  campos: [string, (valor: T) => string | null][],
  antes: T | null,
  despues: T,
): LineaDeDetalle[] {
  return campos.flatMap(([campo, escribir]) => {
    const previo = antes === null ? null : escribir(antes);
    const nuevo = escribir(despues);
    return previo === nuevo ? [] : [{ campo, antes: previo, despues: nuevo }];
  });
}

export const enSoles = (precio: string) => `S/ ${precio}`;

/** «FUTBOL_7» → «Fútbol 7». */
export function tamanoLegible(tipo: string): string {
  if (!esTipoDeCancha(tipo)) return tipo;
  const nombre = NOMBRE_DEL_TIPO[tipo];
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/** Minutos desde la medianoche como «HH:MM»; 1440 es «24:00». */
export function enHora(minutos: number): string {
  const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
  return `${horas}:${String(minutos % 60).padStart(2, '0')}`;
}

const FECHA_EN_LIMA = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const HORA_EN_LIMA = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Rango en hora de Lima, como «mar 24 nov 2026, 10:30 – 14:00». */
export function rangoEnLima(inicio: string, fin: string): string {
  const [desde, hasta] = [new Date(inicio), new Date(fin)];
  const dia = (fecha: Date) =>
    FECHA_EN_LIMA.format(fecha).replace(/\./g, '').replace(/,/g, '');
  const final =
    dia(desde) === dia(hasta)
      ? HORA_EN_LIMA.format(hasta)
      : `${dia(hasta)}, ${HORA_EN_LIMA.format(hasta)}`;
  return `${dia(desde)}, ${HORA_EN_LIMA.format(desde)} – ${final}`;
}
