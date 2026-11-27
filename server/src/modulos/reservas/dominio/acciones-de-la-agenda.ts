import type { EstadoDeReserva } from './reserva.repository';

/** Las operaciones que recepción abre desde la agenda; cada una vive en su propio proceso. */
export type AccionDeLaAgenda =
  'CHECK_IN' | 'MARCAR_AUSENTE' | 'FINALIZAR' | 'CANCELAR' | 'REUBICAR';

// Cada proceso vuelve a comprobar sus propias condiciones (hora, ventana de llegada…).
const ACCIONES_POR_ESTADO: Record<EstadoDeReserva, AccionDeLaAgenda[]> = {
  PENDIENTE_DE_PAGO: ['CANCELAR', 'REUBICAR'],
  // Con un pago por validar se espera su resultado antes de tocar la reserva.
  PENDIENTE_DE_VALIDACION: [],
  CONFIRMADA: ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR'],
  EN_JUEGO: ['FINALIZAR'],
  EXPIRADA: [],
};

/** Lo que el estado de la reserva permite hacer desde la agenda. */
export function accionesPermitidas(
  estado: EstadoDeReserva,
): AccionDeLaAgenda[] {
  return [...ACCIONES_POR_ESTADO[estado]];
}
