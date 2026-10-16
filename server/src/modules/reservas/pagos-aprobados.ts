import type { PrismaService } from '../../prisma/prisma.service';
import type { PagoAprobado } from './montos-reserva';

export async function pagosAprobadosPorReserva(
  prisma: Pick<PrismaService, 'pago'>,
  reservaIds: number[],
) {
  const porReserva = new Map<number, PagoAprobado[]>();
  if (reservaIds.length === 0) return porReserva;
  const sumas = await prisma.pago.groupBy({
    by: ['reservaId', 'concepto'],
    where: { reservaId: { in: reservaIds }, estado: 'APROBADO' },
    _sum: { monto: true },
  });
  for (const { reservaId, concepto, _sum } of sumas) {
    const lista = porReserva.get(reservaId) ?? [];
    lista.push({ concepto, monto: _sum.monto ?? 0 });
    porReserva.set(reservaId, lista);
  }
  return porReserva;
}
