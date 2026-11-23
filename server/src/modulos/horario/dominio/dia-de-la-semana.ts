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
