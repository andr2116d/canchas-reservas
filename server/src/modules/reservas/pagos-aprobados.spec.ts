import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { pagosAprobadosPorReserva } from './pagos-aprobados';

describe('pagos aprobados por reserva', () => {
  const prisma = { pago: { groupBy: jest.fn() } };
  const cliente = prisma as unknown as PrismaService;

  beforeEach(() => jest.resetAllMocks());

  it('agrupa los pagos aprobados de varias reservas en una sola consulta', async () => {
    prisma.pago.groupBy.mockResolvedValue([
      {
        reservaId: 1,
        concepto: 'ADELANTO',
        _sum: { monto: new Prisma.Decimal('40.00') },
      },
      {
        reservaId: 1,
        concepto: 'SALDO',
        _sum: { monto: new Prisma.Decimal('40.00') },
      },
      { reservaId: 2, concepto: 'ADELANTO', _sum: { monto: null } },
    ]);
    const pagos = await pagosAprobadosPorReserva(cliente, [1, 2, 3]);

    expect(prisma.pago.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.pago.groupBy).toHaveBeenCalledWith({
      by: ['reservaId', 'concepto'],
      where: { reservaId: { in: [1, 2, 3] }, estado: 'APROBADO' },
      _sum: { monto: true },
    });
    expect(pagos.get(1)).toEqual([
      { concepto: 'ADELANTO', monto: new Prisma.Decimal('40.00') },
      { concepto: 'SALDO', monto: new Prisma.Decimal('40.00') },
    ]);
    expect(pagos.get(2)).toEqual([{ concepto: 'ADELANTO', monto: 0 }]);
    expect(pagos.has(3)).toBe(false);
  });

  it('sin reservas no consulta los pagos', async () => {
    const pagos = await pagosAprobadosPorReserva(cliente, []);
    expect(pagos.size).toBe(0);
    expect(prisma.pago.groupBy).not.toHaveBeenCalled();
  });
});
