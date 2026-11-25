export const DIAS_DE_LA_SEMANA = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

export type DiaDeLaSemana = (typeof DIAS_DE_LA_SEMANA)[number];

export function esDiaDeLaSemana(valor: string): valor is DiaDeLaSemana {
  return (DIAS_DE_LA_SEMANA as readonly string[]).includes(valor);
}

// getUTCDay cuenta desde el domingo.
const POR_NUMERO: DiaDeLaSemana[] = [
  'DOMINGO',
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
];

/** El día de la semana de una fecha `AAAA-MM-DD` ya revisada. */
export function diaDeLaSemanaDe(fecha: string): DiaDeLaSemana {
  return POR_NUMERO[new Date(`${fecha}T00:00:00Z`).getUTCDay()];
}
