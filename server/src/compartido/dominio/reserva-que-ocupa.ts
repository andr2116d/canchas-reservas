/** Etapas de una reserva que ocupan su turno, las mismas que la exclusión de la base. */
export const ESTADOS_QUE_OCUPAN = [
  'PENDIENTE_DE_PAGO',
  'PENDIENTE_DE_VALIDACION',
  'CONFIRMADA',
  'EN_JUEGO',
] as const;
export type EstadoQueOcupa = (typeof ESTADOS_QUE_OCUPAN)[number];

export function ocupaElTurno(estado: string): estado is EstadoQueOcupa {
  return (ESTADOS_QUE_OCUPAN as readonly string[]).includes(estado);
}

/** Una reserva pendiente de pago deja de retener el turno al vencer, sin esperar a ninguna tarea. */
export function retieneElTurno(
  { venceEn }: { venceEn: Date | null },
  ahora: Date,
): boolean {
  return venceEn === null || venceEn > ahora;
}
