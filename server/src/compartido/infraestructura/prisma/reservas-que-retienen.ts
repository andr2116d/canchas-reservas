import { ESTADOS_QUE_OCUPAN } from '../../dominio/reserva-que-ocupa';
import type { Prisma } from '../../../generated/prisma/client';

/** Las reservas que en ese momento retienen su turno: ocupan y, si esperan pago, aún no vencen. */
export function reservasQueRetienen(ahora: Date): Prisma.ReservaWhereInput {
  return {
    estado: { in: [...ESTADOS_QUE_OCUPAN] },
    OR: [{ venceEn: null }, { venceEn: { gt: ahora } }],
  };
}
