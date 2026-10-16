import { NotFoundException } from '@nestjs/common';
import { Reloj } from '../../common/reloj/reloj';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CanchasService } from '../canchas/canchas.service';
import { AgendaService } from './agenda.service';

/** 23:30 del 20 en Lima, ya 21 en UTC. */
const AHORA = new Date('2026-10-21T04:30:00.000Z');

const reserva = (datos: Record<string, unknown> = {}) => ({
  id: 41,
  codigo: 'LP-000041',
  horaInicio: '18:00',
  horaFin: '19:00',
  franja: 'NOCHE',
  estado: 'CONFIRMADA',
  valorTurno: new Prisma.Decimal('80.00'),
  adelantoMinimo: new Prisma.Decimal('40.00'),
  cancha: { id: 2, nombre: 'Cancha 2', tamano: 'FUTBOL_7' },
  jugador: {
    id: 7,
    nombres: 'Lucía',
    apellidos: 'Ramírez',
    telefono: '987654321',
  },
  ...datos,
});

const suma = (reservaId: number, concepto: string, monto: string) => ({
  reservaId,
  concepto,
  _sum: { monto: new Prisma.Decimal(monto) },
});

describe('AgendaService', () => {
  const prisma = {
    reserva: { findMany: jest.fn() },
    pago: { groupBy: jest.fn() },
  };
  const reloj = { ahora: jest.fn() };
  const canchas = { buscar: jest.fn() };
  const servicio = new AgendaService(
    prisma as unknown as PrismaService,
    reloj as unknown as Reloj,
    canchas as unknown as CanchasService,
  );

  const consultaReservas = () =>
    prisma.reserva.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
      orderBy: unknown;
    };

  beforeEach(() => {
    jest.resetAllMocks();
    reloj.ahora.mockReturnValue(AHORA);
    prisma.reserva.findMany.mockResolvedValue([reserva()]);
    prisma.pago.groupBy.mockResolvedValue([suma(41, 'ADELANTO', '40.00')]);
  });

  it('devuelve el turno con el contrato de la agenda', async () => {
    await expect(servicio.consultar({ fecha: '2026-10-20' })).resolves.toEqual([
      {
        id: 41,
        codigo: 'LP-000041',
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        cancha: { id: 2, nombre: 'Cancha 2', tamano: 'FUTBOL_7' },
        cliente: { id: 7, nombre: 'Lucía Ramírez', telefono: '987654321' },
        estado: 'CONFIRMADA',
        valorTurno: 80,
        adelantoMinimo: 40,
        adelantoPagado: 40,
        saldoPendiente: 40,
        acciones: ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR'],
      },
    ]);
  });

  it('sin apellidos usa solo los nombres del cliente', async () => {
    prisma.reserva.findMany.mockResolvedValue([
      reserva({
        jugador: { id: 7, nombres: 'Lucía', apellidos: null, telefono: '9' },
      }),
    ]);
    const [turno] = await servicio.consultar({ fecha: '2026-10-20' });
    expect(turno.cliente.nombre).toBe('Lucía');
  });

  describe('saldo', () => {
    it('resta los adelantos y saldos aprobados de cada reserva', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva({ id: 1 }),
        reserva({ id: 2 }),
        reserva({ id: 3 }),
      ]);
      prisma.pago.groupBy.mockResolvedValue([
        suma(1, 'ADELANTO', '40.00'),
        suma(1, 'SALDO', '40.00'),
        suma(2, 'ADELANTO', '25.50'),
        suma(2, 'ADICIONALES', '30.00'),
      ]);
      const turnos = await servicio.consultar({ fecha: '2026-10-20' });
      expect(
        turnos.map(({ adelantoPagado, saldoPendiente }) => ({
          adelantoPagado,
          saldoPendiente,
        })),
      ).toEqual([
        { adelantoPagado: 40, saldoPendiente: 0 },
        { adelantoPagado: 25.5, saldoPendiente: 54.5 },
        { adelantoPagado: 0, saldoPendiente: 80 },
      ]);
    });

    it('agrupa los pagos aprobados en una sola consulta', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva({ id: 1 }),
        reserva({ id: 2 }),
      ]);
      await servicio.consultar({ fecha: '2026-10-20' });
      expect(prisma.pago.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.pago.groupBy).toHaveBeenCalledWith({
        by: ['reservaId', 'concepto'],
        where: { reservaId: { in: [1, 2] }, estado: 'APROBADO' },
        _sum: { monto: true },
      });
    });

    it('sin reservas no consulta los pagos', async () => {
      prisma.reserva.findMany.mockResolvedValue([]);
      await expect(
        servicio.consultar({ fecha: '2026-10-20' }),
      ).resolves.toEqual([]);
      expect(prisma.pago.groupBy).not.toHaveBeenCalled();
    });
  });

  describe('orden', () => {
    it('ordena por hora de inicio y luego por nombre de cancha', async () => {
      await servicio.consultar({ fecha: '2026-10-20' });
      expect(consultaReservas().orderBy).toEqual([
        { horaInicio: 'asc' },
        { cancha: { nombre: 'asc' } },
        { id: 'asc' },
      ]);
    });

    it('respeta el orden que devuelve la base', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva({ id: 1, horaInicio: '08:00' }),
        reserva({ id: 2, horaInicio: '18:00' }),
      ]);
      const turnos = await servicio.consultar({ fecha: '2026-10-20' });
      expect(turnos.map((t) => t.id)).toEqual([1, 2]);
    });
  });

  describe('filtros', () => {
    it('filtra solo por la fecha cuando no hay más filtros', async () => {
      await servicio.consultar({ fecha: '2026-10-20' });
      expect(consultaReservas().where).toEqual({
        fecha: new Date('2026-10-20T00:00:00.000Z'),
        canchaId: undefined,
        estado: undefined,
      });
      expect(canchas.buscar).not.toHaveBeenCalled();
    });

    it('sin fecha usa el día de hoy en Lima', async () => {
      await servicio.consultar({});
      expect(consultaReservas().where.fecha).toEqual(
        new Date('2026-10-20T00:00:00.000Z'),
      );
    });

    it('filtra por cancha después de comprobar que existe', async () => {
      await servicio.consultar({ fecha: '2026-10-20', canchaId: 2 });
      expect(canchas.buscar).toHaveBeenCalledWith(2);
      expect(consultaReservas().where.canchaId).toBe(2);
    });

    it('filtra por estado', async () => {
      await servicio.consultar({ fecha: '2026-10-20', estado: 'EN_JUEGO' });
      expect(consultaReservas().where.estado).toBe('EN_JUEGO');
    });

    it('combina cancha y estado', async () => {
      await servicio.consultar({
        fecha: '2026-10-20',
        canchaId: 2,
        estado: 'CONFIRMADA',
      });
      expect(consultaReservas().where).toEqual({
        fecha: new Date('2026-10-20T00:00:00.000Z'),
        canchaId: 2,
        estado: 'CONFIRMADA',
      });
    });

    it('una cancha inexistente devuelve 404 sin consultar reservas', async () => {
      canchas.buscar.mockRejectedValue(new NotFoundException());
      await expect(
        servicio.consultar({ fecha: '2026-10-20', canchaId: 999 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.reserva.findMany).not.toHaveBeenCalled();
    });
  });
});
