/** Cuánto retiene el turno una reserva que espera pago. Fijo hasta que administración pueda definirlo. */
export const MINUTOS_DE_RETENCION = 15;

/** Reservas pendientes de pago que una persona puede tener a la vez, para no acaparar turnos. */
export const MAXIMO_DE_PENDIENTES_DE_PAGO = 2;

const MS_POR_MINUTO = 60 * 1000;

/** La retención termina a los 15 minutos o al empezar el turno, lo que llegue antes. */
export function finDeLaRetencion(creadaEn: Date, inicio: Date): Date {
  const limite = new Date(
    creadaEn.getTime() + MINUTOS_DE_RETENCION * MS_POR_MINUTO,
  );
  return limite < inicio ? limite : inicio;
}
