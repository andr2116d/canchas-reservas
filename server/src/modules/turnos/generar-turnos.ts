import type { Franja } from '../../generated/prisma/enums';

export const DURACION_TURNO_MIN = 60;

export interface DiaHorario {
  abierto: boolean;
  apertura: string | null;
  cierre: string | null;
}

export interface Turno {
  horaInicio: string;
  horaFin: string;
  franja: Franja;
}

export function aMinutos(hora: string) {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

export function aHora(minutos: number) {
  const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
  return `${horas}:${String(minutos % 60).padStart(2, '0')}`;
}

function partirTramo(inicio: number, fin: number, franja: Franja): Turno[] {
  const turnos: Turno[] = [];
  for (
    let desde = inicio;
    desde + DURACION_TURNO_MIN <= fin;
    desde += DURACION_TURNO_MIN
  ) {
    turnos.push({
      horaInicio: aHora(desde),
      horaFin: aHora(desde + DURACION_TURNO_MIN),
      franja,
    });
  }
  return turnos;
}

export function generarTurnos(dia: DiaHorario, inicioNoche: string): Turno[] {
  if (!dia.abierto || !dia.apertura || !dia.cierre) return [];
  const apertura = aMinutos(dia.apertura);
  const cierre = aMinutos(dia.cierre);
  const noche = aMinutos(inicioNoche);
  return [
    ...partirTramo(apertura, Math.min(noche, cierre), 'DIA'),
    ...partirTramo(Math.max(noche, apertura), cierre, 'NOCHE'),
  ];
}

export function diaSemanaDe(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00-05:00`).getUTCDay();
  return dia === 0 ? 7 : dia;
}
