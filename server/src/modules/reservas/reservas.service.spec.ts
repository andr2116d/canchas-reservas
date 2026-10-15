import { BadRequestException, ConflictException } from '@nestjs/common';
import { Reloj } from '../../common/reloj/reloj';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ReglaCancelacionService } from '../regla-cancelacion/regla-cancelacion.service';
import { TarifasService } from '../tarifas/tarifas.service';
import { TurnosService } from '../turnos/turnos.service';
import {
  INTENTOS_CODIGO,
  MENSAJES_RESERVA,
  ReservasService,
} from './reservas.service';

const JUGADOR_ID = 5;
const AHORA = new Date('2026-10-15T15:00:00.000Z');
const DATOS = {
  canchaId: 2,
  fecha: '2026-10-20',
  horaInicio: '18:00',
  usarCredito: false,
};
const INICIO_EN = new Date('2026-10-20T23:00:00.000Z');

const violaUnico = (indice: string) =>
  Object.assign(new Error('P2002'), {
    code: 'P2002',
    meta: { driverAdapterError: { cause: { constraint: { index: indice } } } },
  });

describe('ReservasService', () => {
  const prisma = {
    usuario: { findUnique: jest.fn() },
    cancha: { findUnique: jest.fn() },
    reserva: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    configuracion: { findUniqueOrThrow: jest.fn() },
    reglaCancelacion: { findUniqueOrThrow: jest.fn() },
    credito: { aggregate: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  const reloj = { ahora: jest.fn() };
  const turnos = { generar: jest.fn() };
  const tarifas = { calcularTurno: jest.fn() };
  const auditoria = { registrar: jest.fn() };
  const servicio = new ReservasService(
    prisma as unknown as PrismaService,
    reloj as unknown as Reloj,
    turnos as unknown as TurnosService,
    tarifas as unknown as TarifasService,
    new ReglaCancelacionService(prisma as unknown as PrismaService),
    auditoria as unknown as AuditoriaService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    reloj.ahora.mockReturnValue(AHORA);
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    prisma.usuario.findUnique.mockResolvedValue({
      rol: 'JUGADOR',
      estado: 'ACTIVO',
    });
    prisma.cancha.findUnique.mockResolvedValue({
      id: 2,
      nombre: 'Cancha 2',
      tamano: 'FUTBOL_5',
      activa: true,
      estado: 'OPERATIVA',
    });
    turnos.generar.mockResolvedValue([
      { horaInicio: '17:00', horaFin: '18:00', franja: 'DIA' },
      { horaInicio: '18:00', horaFin: '19:00', franja: 'NOCHE' },
    ]);
    tarifas.calcularTurno.mockResolvedValue({
      valor: new Prisma.Decimal('80.00'),
      adelanto: new Prisma.Decimal('40.00'),
    });
    prisma.reserva.count.mockResolvedValue(0);
    prisma.reserva.findFirst.mockResolvedValue(null);
    prisma.configuracion.findUniqueOrThrow.mockResolvedValue({
      tiempoLimitePagoMin: 15,
    });
    prisma.reglaCancelacion.findUniqueOrThrow.mockResolvedValue({
      id: 1,
      horasAnticipacion: 24,
      tipoCompensacion: 'CREDITO',
    });
    prisma.credito.aggregate.mockResolvedValue({ _sum: { saldo: null } });
    prisma.reserva.create.mockImplementation(
      ({ data }: { data: { codigo: string; venceEn: Date } }) =>
        Promise.resolve({
          id: 10,
          codigo: data.codigo,
          estado: 'PENDIENTE_PAGO',
          venceEn: data.venceEn,
        }),
    );
  });

  const errorDe = (promesa: Promise<unknown>) =>
    promesa.catch((e: unknown) => e);
  const mensajeDe = async (promesa: Promise<unknown>) => {
    const error = (await errorDe(promesa)) as BadRequestException;
    return (error.getResponse() as { message: string }).message;
  };
  const datosCreados = () =>
    (
      prisma.reserva.create.mock.calls[0] as [{ data: Record<string, unknown> }]
    )[0].data;

  describe('orden de las validaciones', () => {
    const pasos = [
      {
        nombre: 'jugador inactivo',
        fallar: () =>
          prisma.usuario.findUnique.mockResolvedValue({
            rol: 'JUGADOR',
            estado: 'INACTIVO',
          }),
        mensaje: MENSAJES_RESERVA.jugadorInactivo,
        siguiente: () => prisma.cancha.findUnique,
      },
      {
        nombre: 'turno pasado',
        fallar: () => reloj.ahora.mockReturnValue(INICIO_EN),
        mensaje: MENSAJES_RESERVA.turnoPasado,
        siguiente: () => prisma.cancha.findUnique,
      },
      {
        nombre: 'fecha a más de 30 días',
        fallar: () =>
          reloj.ahora.mockReturnValue(new Date('2026-09-19T15:00:00.000Z')),
        mensaje: MENSAJES_RESERVA.fueraDeRango,
        siguiente: () => prisma.cancha.findUnique,
      },
      {
        nombre: 'cancha inexistente',
        fallar: () => prisma.cancha.findUnique.mockResolvedValue(null),
        mensaje: MENSAJES_RESERVA.canchaNoEncontrada,
        siguiente: () => turnos.generar,
      },
      {
        nombre: 'cancha desactivada',
        fallar: () =>
          prisma.cancha.findUnique.mockResolvedValue({
            id: 2,
            activa: false,
            estado: 'EN_MANTENIMIENTO',
          }),
        mensaje: MENSAJES_RESERVA.canchaDesactivada,
        siguiente: () => turnos.generar,
      },
      {
        nombre: 'cancha en mantenimiento',
        fallar: () =>
          prisma.cancha.findUnique.mockResolvedValue({
            id: 2,
            activa: true,
            estado: 'EN_MANTENIMIENTO',
          }),
        mensaje: MENSAJES_RESERVA.canchaEnMantenimiento,
        siguiente: () => turnos.generar,
      },
      {
        nombre: 'turno fuera del horario',
        fallar: () => turnos.generar.mockResolvedValue([]),
        mensaje: MENSAJES_RESERVA.fueraDeHorario,
        siguiente: () => tarifas.calcularTurno,
      },
      {
        nombre: 'sin tarifa',
        fallar: () => tarifas.calcularTurno.mockResolvedValue(null),
        mensaje: MENSAJES_RESERVA.sinTarifa,
        siguiente: () => prisma.reserva.count,
      },
      {
        nombre: 'dos pendientes',
        fallar: () => prisma.reserva.count.mockResolvedValue(2),
        mensaje: MENSAJES_RESERVA.limitePendientes,
        siguiente: () => prisma.reserva.findFirst,
      },
      {
        nombre: 'turno tomado',
        fallar: () => prisma.reserva.findFirst.mockResolvedValue({ id: 1 }),
        mensaje: MENSAJES_RESERVA.turnoNoDisponible,
        siguiente: () => prisma.reserva.create,
      },
    ];

    it.each(pasos)(
      '$nombre corta antes del paso siguiente',
      async ({ fallar, mensaje, siguiente }) => {
        fallar();
        await expect(
          mensajeDe(servicio.crear(JUGADOR_ID, DATOS)),
        ).resolves.toBe(mensaje);
        expect(siguiente()).not.toHaveBeenCalled();
        expect(prisma.reserva.create).not.toHaveBeenCalled();
      },
    );

    it('si fallan varias, responde la primera según la spec', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);
      turnos.generar.mockResolvedValue([]);
      prisma.reserva.count.mockResolvedValue(2);
      await expect(mensajeDe(servicio.crear(JUGADOR_ID, DATOS))).resolves.toBe(
        MENSAJES_RESERVA.canchaNoEncontrada,
      );
    });

    it('los motivos del criterio 5 responden 400 y los de cupo 409', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);
      await expect(
        errorDe(servicio.crear(JUGADOR_ID, DATOS)),
      ).resolves.toBeInstanceOf(BadRequestException);

      prisma.cancha.findUnique.mockResolvedValue({
        id: 2,
        activa: true,
        estado: 'OPERATIVA',
      });
      prisma.reserva.count.mockResolvedValue(2);
      await expect(
        errorDe(servicio.crear(JUGADOR_ID, DATOS)),
      ).resolves.toBeInstanceOf(ConflictException);
    });

    it('el resumen aplica las mismas validaciones sin guardar', async () => {
      prisma.reserva.count.mockResolvedValue(2);
      await expect(
        mensajeDe(servicio.resumen(JUGADOR_ID, DATOS)),
      ).resolves.toBe(MENSAJES_RESERVA.limitePendientes);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.reserva.create).not.toHaveBeenCalled();
    });
  });

  describe('crear', () => {
    it('bloquea al jugador antes de validar', async () => {
      await servicio.crear(JUGADOR_ID, DATOS);
      const [bloqueo] = prisma.$queryRaw.mock.invocationCallOrder;
      const [lectura] = prisma.usuario.findUnique.mock.invocationCallOrder;
      expect(bloqueo).toBeLessThan(lectura);
      const [partes, id] = prisma.$queryRaw.mock.calls[0] as [string[], number];
      expect(partes.join('$1')).toBe(
        'SELECT id FROM usuario WHERE id = $1 FOR UPDATE',
      );
      expect(id).toBe(JUGADOR_ID);
    });

    it('guarda montos, turno en Lima, copia de la regla y auditoría', async () => {
      const creada = await servicio.crear(JUGADOR_ID, DATOS);
      expect(datosCreados()).toMatchObject({
        jugadorId: JUGADOR_ID,
        creadoPorId: JUGADOR_ID,
        canchaId: 2,
        fecha: new Date('2026-10-20T00:00:00.000Z'),
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        inicioEn: INICIO_EN,
        finEn: new Date('2026-10-21T00:00:00.000Z'),
        valorTurno: new Prisma.Decimal('80.00'),
        adelantoMinimo: new Prisma.Decimal('40.00'),
        estado: 'PENDIENTE_PAGO',
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
        creadoEn: AHORA,
      });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: JUGADOR_ID,
          accion: 'CREAR',
          entidad: 'RESERVA',
          entidadId: 10,
        }),
        prisma,
      );
      expect(creada).toMatchObject({ id: 10, estado: 'PENDIENTE_PAGO' });
    });

    describe('venceEn', () => {
      it('es creadoEn más el tiempo límite de la configuración', async () => {
        prisma.configuracion.findUniqueOrThrow.mockResolvedValue({
          tiempoLimitePagoMin: 20,
        });
        const creada = await servicio.crear(JUGADOR_ID, DATOS);
        expect(creada.venceEn).toEqual(new Date('2026-10-15T15:20:00.000Z'));
      });

      it('es el inicio del turno si empieza antes del límite', async () => {
        reloj.ahora.mockReturnValue(new Date('2026-10-20T22:50:00.000Z'));
        const creada = await servicio.crear(JUGADOR_ID, DATOS);
        expect(creada.venceEn).toEqual(INICIO_EN);
      });
    });

    describe('código', () => {
      it('genera 8 caracteres en mayúsculas y números', async () => {
        const creada = await servicio.crear(JUGADOR_ID, DATOS);
        expect(creada.codigo).toMatch(/^[A-Z0-9]{8}$/);
      });

      it('reintenta con otro código si choca con uno existente', async () => {
        prisma.$transaction
          .mockRejectedValueOnce(violaUnico('reserva_codigo_key'))
          .mockImplementation((fn: (tx: unknown) => unknown) => fn(prisma));
        await expect(servicio.crear(JUGADOR_ID, DATOS)).resolves.toMatchObject({
          id: 10,
        });
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      });

      it(`deja de reintentar después de ${INTENTOS_CODIGO} choques`, async () => {
        prisma.$transaction.mockRejectedValue(violaUnico('reserva_codigo_key'));
        await expect(
          errorDe(servicio.crear(JUGADOR_ID, DATOS)),
        ).resolves.toMatchObject({ code: 'P2002' });
        expect(prisma.$transaction).toHaveBeenCalledTimes(INTENTOS_CODIGO);
      });

      it('un choque del índice del turno responde 409 sin reintentar', async () => {
        prisma.$transaction.mockRejectedValue(
          violaUnico('reserva_turno_unico'),
        );
        const error = (await errorDe(
          servicio.crear(JUGADOR_ID, DATOS),
        )) as ConflictException;
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.getResponse()).toMatchObject({
          statusCode: 409,
          message: MENSAJES_RESERVA.turnoNoDisponible,
        });
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('resumen', () => {
    it('devuelve montos como número, crédito y plazo de la regla', async () => {
      prisma.credito.aggregate.mockResolvedValue({
        _sum: { saldo: new Prisma.Decimal('12.50') },
      });
      await expect(servicio.resumen(JUGADOR_ID, DATOS)).resolves.toEqual({
        cancha: { id: 2, nombre: 'Cancha 2', tamano: 'FUTBOL_5' },
        fecha: '2026-10-20',
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        valorTurno: 80,
        adelanto: 40,
        saldo: 40,
        creditoDisponible: 12.5,
        minutosParaPagar: 15,
        regla: {
          horasAnticipacion: 24,
          tipoCompensacion: 'CREDITO',
          plazoLimite: '2026-10-19T23:00:00.000Z',
        },
      });
      expect(prisma.credito.aggregate).toHaveBeenCalledWith({
        where: { jugadorId: JUGADOR_ID, saldo: { gt: 0 } },
        _sum: { saldo: true },
      });
    });

    it('sin créditos el disponible es 0', async () => {
      await expect(servicio.resumen(JUGADOR_ID, DATOS)).resolves.toMatchObject({
        creditoDisponible: 0,
      });
    });
  });

  describe('mias', () => {
    const reserva = (id: number, inicio: string, fin: string) => ({
      id,
      codigo: `COD${id}`,
      fecha: new Date(`${inicio.slice(0, 10)}T00:00:00.000Z`),
      horaInicio: '18:00',
      horaFin: '19:00',
      franja: 'NOCHE',
      estado: 'PENDIENTE_PAGO',
      venceEn: null,
      inicioEn: new Date(inicio),
      finEn: new Date(fin),
      cancha: { id: 2, nombre: 'Cancha 2', tamano: 'FUTBOL_5' },
    });

    it('pone primero las próximas y luego las pasadas más recientes', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(1, '2026-10-10T23:00:00.000Z', '2026-10-11T00:00:00.000Z'),
        reserva(2, '2026-10-12T23:00:00.000Z', '2026-10-13T00:00:00.000Z'),
        reserva(3, '2026-10-15T14:30:00.000Z', '2026-10-15T15:30:00.000Z'),
        reserva(4, '2026-10-20T23:00:00.000Z', '2026-10-21T00:00:00.000Z'),
      ]);
      const mias = await servicio.mias(JUGADOR_ID);
      expect(mias.map((r) => r.id)).toEqual([3, 4, 2, 1]);
      expect(mias[1]).toEqual({
        id: 4,
        codigo: 'COD4',
        fecha: '2026-10-20',
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        estado: 'PENDIENTE_PAGO',
        venceEn: null,
        cancha: { id: 2, nombre: 'Cancha 2', tamano: 'FUTBOL_5' },
      });
      expect(prisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { jugadorId: JUGADOR_ID } }),
      );
    });
  });
});
