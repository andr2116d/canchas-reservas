import type { EstadoReserva } from '../../generated/prisma/enums';

export type AccionAgenda =
  | 'CHECK_IN'
  | 'MARCAR_AUSENTE'
  | 'CANCELAR'
  | 'REUBICAR'
  | 'REGISTRAR_ADICIONALES'
  | 'FINALIZAR';

const ACCIONES_POR_ESTADO: Record<EstadoReserva, readonly AccionAgenda[]> = {
  PENDIENTE_PAGO: ['CANCELAR', 'REUBICAR'],
  PENDIENTE_VALIDACION: [],
  CONFIRMADA: ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR'],
  EN_JUEGO: ['REGISTRAR_ADICIONALES', 'FINALIZAR'],
  FINALIZADA: [],
  CANCELADA: [],
  EXPIRADA: [],
  AUSENTE: [],
};

export function accionesAgenda(estado: EstadoReserva): AccionAgenda[] {
  return [...ACCIONES_POR_ESTADO[estado]];
}
