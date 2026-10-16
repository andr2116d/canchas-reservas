import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reloj } from '../../common/reloj/reloj';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TurnosGateway } from '../tiempo-real/turnos.gateway';
import { MENSAJES_PAGO, PagosReservaService } from './pagos-reserva.service';

const AHORA = new Date('2026-10-20T15:00:00.000Z');

const reserva = (datos: Record<string, unknown> = {}) => ({
  id: 41,
  codigo: 'LP-000041',
  estado: 'PENDIENTE_PAGO',
  fecha: new Date('2026-10-20T00:00:00.000Z'),
  canchaId: 2,
  finEn: new Date('2026-10-21T00:00:00.000Z'),
  valorTurno: new Prisma.Decimal('80.00'),
  adelantoMinimo: new Prisma.Decimal('40.00'),
  ...datos,
});

describe('PagosReservaService', () => {
  const tx = {
    $queryRaw: jest.fn(),
    reserva: { findUnique: jest.fn(), update: jest.fn() },
    pago: { groupBy: jest.fn(), create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((fn: (cliente: typeof tx) => unknown) => fn(tx)),
  };
  const reloj = { ahora: jest.fn() };
  const auditoria = { registrar: jest.fn() };
  const gateway = { notificar: jest.fn() };
  const servicio = new PagosReservaService(
    prisma as unknown as PrismaService,
    reloj as unknown as Reloj,
    auditoria as unknown as AuditoriaService,
    gateway as unknown as TurnosGateway,
  );

  const pagosCreados = () =>
    tx.pago.create.mock.calls.map(
      ([{ data }]: [{ data: Record<string, unknown> }]) => ({
        concepto: data.concepto,
        monto: String(data.monto),
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    reloj.ahora.mockReturnValue(AHORA);
    tx.reserva.findUnique.mockResolvedValue(reserva());
    tx.pago.groupBy.mockResolvedValue([]);
  });

  it('registra el adelanto, confirma la reserva y avisa el cambio', async () => {
    await expect(
      servicio.confirmar(41, { metodo: 'YAPE', numeroOperacion: '123' }, 9),
    ).resolves.toEqual({
      id: 41,
      codigo: 'LP-000041',
      estado: 'CONFIRMADA',
      adelantoPagado: 40,
      saldoPendiente: 40,
    });
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(pagosCreados()).toEqual([{ concepto: 'ADELANTO', monto: '40' }]);
    expect(tx.pago.create.mock.calls[0][0].data).toMatchObject({
      reservaId: 41,
      canal: 'RECEPCION',
      metodo: 'YAPE',
      estado: 'APROBADO',
      numeroOperacion: '123',
      registradoPorId: 9,
      validadoPorId: 9,
      validadoEn: AHORA,
    });
    expect(tx.reserva.update).toHaveBeenCalledWith({
      where: { id: 41 },
      data: { estado: 'CONFIRMADA', confirmadaEn: AHORA, venceEn: null },
    });
    expect(auditoria.registrar).toHaveBeenCalledWith(
      {
        usuarioId: 9,
        accion: 'CONFIRMAR_PAGO',
        entidad: 'RESERVA',
        entidadId: 41,
        detalle: {
          codigo: 'LP-000041',
          anterior: { estado: 'PENDIENTE_PAGO' },
          nuevo: { estado: 'CONFIRMADA' },
          metodo: 'YAPE',
          monto: 40,
          numeroOperacion: '123',
        },
      },
      tx,
    );
    expect(gateway.notificar).toHaveBeenCalledWith('2026-10-20', 2);
  });

  it('con pago completo registra adelanto y saldo y deja la reserva sin saldo', async () => {
    const confirmada = await servicio.confirmar(
      41,
      { metodo: 'PLIN', pagoCompleto: true },
      9,
    );
    expect(pagosCreados()).toEqual([
      { concepto: 'ADELANTO', monto: '40' },
      { concepto: 'SALDO', monto: '40' },
    ]);
    expect(confirmada).toMatchObject({ adelantoPagado: 40, saldoPendiente: 0 });
    expect(auditoria.registrar.mock.calls[0][0].detalle).toMatchObject({
      monto: 80,
    });
  });

  it('descuenta el crédito ya aplicado al adelanto', async () => {
    tx.pago.groupBy.mockResolvedValue([
      {
        reservaId: 41,
        concepto: 'ADELANTO',
        _sum: { monto: new Prisma.Decimal('15.50') },
      },
    ]);
    const confirmada = await servicio.confirmar(41, { metodo: 'YAPE' }, 9);
    expect(pagosCreados()).toEqual([{ concepto: 'ADELANTO', monto: '24.5' }]);
    expect(confirmada).toMatchObject({ adelantoPagado: 40, saldoPendiente: 40 });
  });

  it('también confirma una reserva pendiente de validación', async () => {
    tx.reserva.findUnique.mockResolvedValue(
      reserva({ estado: 'PENDIENTE_VALIDACION' }),
    );
    await expect(
      servicio.confirmar(41, { metodo: 'TRANSFERENCIA' }, 9),
    ).resolves.toMatchObject({ estado: 'CONFIRMADA' });
  });

  it('una reserva que no existe responde 404', async () => {
    tx.reserva.findUnique.mockResolvedValue(null);
    await expect(
      servicio.confirmar(41, { metodo: 'YAPE' }, 9),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(gateway.notificar).not.toHaveBeenCalled();
  });

  it.each(['CONFIRMADA', 'EN_JUEGO', 'CANCELADA', 'EXPIRADA', 'AUSENTE'])(
    'una reserva %s no se puede confirmar',
    async (estado) => {
      tx.reserva.findUnique.mockResolvedValue(reserva({ estado }));
      const error = await servicio
        .confirmar(41, { metodo: 'YAPE' }, 9)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJES_PAGO.estadoNoPermite,
        errores: {},
      });
      expect(tx.pago.create).not.toHaveBeenCalled();
      expect(tx.reserva.update).not.toHaveBeenCalled();
    },
  );

  it('un turno que ya terminó no se puede confirmar', async () => {
    tx.reserva.findUnique.mockResolvedValue(reserva({ finEn: AHORA }));
    await expect(
      servicio.confirmar(41, { metodo: 'YAPE' }, 9),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.pago.create).not.toHaveBeenCalled();
  });
});
