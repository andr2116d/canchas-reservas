import type { EstadoReserva } from '../../generated/prisma/enums';

// Los mismos estados de reserva_turno_unico y reserva_sin_solape.
export const ESTADOS_OCUPAN_TURNO: EstadoReserva[] = [
  'PENDIENTE_PAGO',
  'PENDIENTE_VALIDACION',
  'CONFIRMADA',
  'EN_JUEGO',
  'FINALIZADA',
];
