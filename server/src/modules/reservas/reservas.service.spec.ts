import { BadRequestException, ConflictException } from '@nestjs/common';
import { Reloj } from '../../common/reloj/reloj';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ReglaCancelacionService } from '../regla-cancelacion/regla-cancelacion.service';
import { TarifasService } from '../tarifas/tarifas.service';
import { TurnosGateway } from '../tiempo-real/turnos.gateway';
import { TurnosService } from '../turnos/turnos.service';
import {
  INTENTOS_CODIGO,
  INTENTOS_CONFLICTO,
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
    credito: { aggregate: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    pago: { create: jest.fn(), groupBy: jest.fn() },
    creditoUso: { create: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  const reloj = { ahora: jest.fn() };
  const turnos = { generar: jest.fn() };
  const tarifas = { calcularTurno: jest.fn() };
  const auditoria = { registrar: jest.fn() };
  const gateway = { notificar: jest.fn() };
  const servicio = new ReservasService(
    prisma as unknown as PrismaService,
    reloj as unknown as Reloj,
    turnos as unknown as TurnosService,
    tarifas as unknown as TarifasService,
    new ReglaCancelacionService(
      prisma as unknown as PrismaService,
      auditoria as unknown as AuditoriaService,
    ),
    auditoria as unknown as AuditoriaService,
    gateway as unknown as TurnosGateway,
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
      ({
        data,
      }: {
        data: { codigo: string; estado: string; venceEn: Date | null };
      }) =>
        Promise.resolve({
          id: 10,
          codigo: data.codigo,
          estado: data.estado,
          venceEn: data.venceEn,
        }),
    );
    prisma.credito.findMany.mockResolvedValue([]);
    prisma.pago.create.mockResolvedValue({ id: 30 });
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
        expect(gateway.notificar).not.toHaveBeenCalled();
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

  describe('turno libre', () => {
    const consultaPorRango = {
      where: {
        canchaId: 2,
        estado: {
          in: [
            'PENDIENTE_PAGO',
            'PENDIENTE_VALIDACION',
            'CONFIRMADA',
            'EN_JUEGO',
            'FINALIZADA',
          ],
        },
        inicioEn: { lt: new Date('2026-10-21T00:00:00.000Z') },
        finEn: { gt: INICIO_EN },
      },
      select: { id: true },
    };

    it('al crear busca reservas que ocupan y se solapan con el turno', async () => {
      await servicio.crear(JUGADOR_ID, DATOS);
      expect(prisma.reserva.findFirst).toHaveBeenCalledWith(consultaPorRango);
    });

    it('el resumen usa la misma comparación por rango', async () => {
      await servicio.resumen(JUGADOR_ID, DATOS);
      expect(prisma.reserva.findFirst).toHaveBeenCalledWith(consultaPorRango);
    });

    it('el resumen responde 409 si el turno se solapa con una reserva', async () => {
      prisma.reserva.findFirst.mockResolvedValue({ id: 1 });
      const error = (await errorDe(
        servicio.resumen(JUGADOR_ID, DATOS),
      )) as ConflictException;
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse()).toMatchObject({
        message: MENSAJES_RESERVA.turnoNoDisponible,
      });
    });
  });

  describe('conflictos en la base', () => {
    const solape = () =>
      Object.assign(new Error('23P01'), {
        meta: { driverAdapterError: { cause: { code: '23P01' } } },
      });
    const conflicto = () =>
      Object.assign(new Error('P2034'), { code: 'P2034' });

    it('un solape en el insert responde 409 sin reintentar', async () => {
      prisma.reserva.create.mockRejectedValue(solape());
      const error = (await errorDe(
        servicio.crear(JUGADOR_ID, DATOS),
      )) as ConflictException;
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse()).toMatchObject({
        statusCode: 409,
        message: MENSAJES_RESERVA.turnoNoDisponible,
        errores: { horaInicio: MENSAJES_RESERVA.turnoNoDisponible },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).not.toHaveBeenCalled();
    });

    it('un conflicto de escritura repite la transacción completa', async () => {
      prisma.credito.findMany.mockResolvedValue([
        { id: 1, saldo: new Prisma.Decimal('10.00') },
      ]);
      prisma.reserva.create.mockRejectedValueOnce(conflicto());
      await expect(
        servicio.crear(JUGADOR_ID, { ...DATOS, usarCredito: true }),
      ).resolves.toMatchObject({ id: 10 });
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(prisma.usuario.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.credito.findMany).toHaveBeenCalledTimes(2);
      const bloqueos = prisma.$queryRaw.mock.calls.map((c) =>
        (c[0] as string[]).join('?'),
      );
      expect(
        bloqueos.filter((sql) => sql.includes('FROM usuario')),
      ).toHaveLength(2);
      expect(
        bloqueos.filter((sql) => sql.includes('FROM credito')),
      ).toHaveLength(2);
      expect(prisma.pago.create).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
    });

    it(`deja de reintentar después de ${INTENTOS_CONFLICTO} conflictos de escritura`, async () => {
      prisma.reserva.create.mockRejectedValue(conflicto());
      await expect(
        errorDe(servicio.crear(JUGADOR_ID, DATOS)),
      ).resolves.toMatchObject({ code: 'P2034' });
      expect(prisma.$transaction).toHaveBeenCalledTimes(INTENTOS_CONFLICTO);
      expect(gateway.notificar).not.toHaveBeenCalled();
    });
  });

  describe('notificación de turnos', () => {
    it('notifica la fecha y la cancha de la reserva creada', async () => {
      await servicio.crear(JUGADOR_ID, DATOS);
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith('2026-10-20', 2);
    });

    it('notifica recién cuando la transacción confirma', async () => {
      let confirmar: (valor: unknown) => void = () => undefined;
      prisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => Promise<unknown>) =>
          fn(prisma).then(
            (reserva) =>
              new Promise((resolve) => {
                confirmar = () => resolve(reserva);
              }),
          ),
      );
      const creando = servicio.crear(JUGADOR_ID, DATOS);
      await new Promise((resolve) => setImmediate(resolve));
      expect(auditoria.registrar).toHaveBeenCalled();
      expect(gateway.notificar).not.toHaveBeenCalled();
      confirmar(undefined);
      await creando;
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
    });

    it('no notifica si la transacción falla', async () => {
      prisma.$transaction.mockRejectedValue(new Error('conexión perdida'));
      await expect(servicio.crear(JUGADOR_ID, DATOS)).rejects.toThrow(
        'conexión perdida',
      );
      expect(gateway.notificar).not.toHaveBeenCalled();
    });

    it('no notifica si falla al guardar dentro de la transacción', async () => {
      prisma.reserva.create.mockRejectedValue(new Error('fallo al guardar'));
      await expect(servicio.crear(JUGADOR_ID, DATOS)).rejects.toThrow(
        'fallo al guardar',
      );
      expect(gateway.notificar).not.toHaveBeenCalled();
    });

    it('notifica una sola vez aunque reintente por código repetido', async () => {
      prisma.$transaction
        .mockRejectedValueOnce(violaUnico('reserva_codigo_key'))
        .mockRejectedValueOnce(violaUnico('reserva_codigo_key'))
        .mockImplementation((fn: (tx: unknown) => unknown) => fn(prisma));
      await servicio.crear(JUGADOR_ID, DATOS);
      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith('2026-10-20', 2);
    });

    it('no notifica si se agotan los reintentos por código', async () => {
      prisma.$transaction.mockRejectedValue(violaUnico('reserva_codigo_key'));
      await errorDe(servicio.crear(JUGADOR_ID, DATOS));
      expect(gateway.notificar).not.toHaveBeenCalled();
    });

    it('no notifica si el turno ya fue tomado', async () => {
      prisma.$transaction.mockRejectedValue(violaUnico('reserva_turno_unico'));
      await expect(
        errorDe(servicio.crear(JUGADOR_ID, DATOS)),
      ).resolves.toBeInstanceOf(ConflictException);
      expect(gateway.notificar).not.toHaveBeenCalled();
    });

    it('no notifica al calcular el resumen', async () => {
      await servicio.resumen(JUGADOR_ID, DATOS);
      expect(gateway.notificar).not.toHaveBeenCalled();
    });
  });

  describe('crédito al adelanto', () => {
    const conCredito = { ...DATOS, usarCredito: true };
    const creditos = (...saldos: string[]) =>
      prisma.credito.findMany.mockResolvedValue(
        saldos.map((saldo, i) => ({
          id: i + 1,
          saldo: new Prisma.Decimal(saldo),
        })),
      );
    const textos = (mock: jest.Mock) =>
      mock.mock.calls.map(([{ data }]: [{ data: Record<string, unknown> }]) =>
        JSON.parse(JSON.stringify(data)),
      );

    it('sin usarCredito no lee créditos ni crea pago', async () => {
      creditos('50');
      const creada = await servicio.crear(JUGADOR_ID, DATOS);
      expect(prisma.credito.findMany).not.toHaveBeenCalled();
      expect(prisma.pago.create).not.toHaveBeenCalled();
      expect(creada.estado).toBe('PENDIENTE_PAGO');
    });

    it('bloquea los créditos vigentes del jugador, los más antiguos primero', async () => {
      creditos('10');
      await servicio.crear(JUGADOR_ID, conCredito);
      const [partes, id] = prisma.$queryRaw.mock.calls[1] as [string[], number];
      expect(partes.join('$1')).toBe(
        'SELECT id FROM credito WHERE jugador_id = $1 AND saldo > 0 ORDER BY creado_en, id FOR UPDATE',
      );
      expect(id).toBe(JUGADOR_ID);
      expect(prisma.credito.findMany).toHaveBeenCalledWith({
        where: { jugadorId: JUGADOR_ID, saldo: { gt: 0 } },
        orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
        select: { id: true, saldo: true },
      });
    });

    it('con crédito menor al adelanto paga una parte y queda pendiente', async () => {
      creditos('10');
      const creada = await servicio.crear(JUGADOR_ID, conCredito);
      expect(textos(prisma.pago.create)).toEqual([
        {
          reservaId: 10,
          concepto: 'ADELANTO',
          canal: 'ONLINE',
          metodo: 'CREDITO',
          estado: 'APROBADO',
          monto: '10',
          registradoPorId: JUGADOR_ID,
          creadoEn: AHORA.toISOString(),
        },
      ]);
      expect(creada).toMatchObject({
        estado: 'PENDIENTE_PAGO',
        venceEn: new Date('2026-10-15T15:15:00.000Z'),
      });
      expect(datosCreados()).toMatchObject({ confirmadaEn: null });
    });

    it('con crédito que cubre el adelanto confirma sin vencimiento', async () => {
      creditos('50');
      const creada = await servicio.crear(JUGADOR_ID, conCredito);
      expect(textos(prisma.pago.create)[0]).toMatchObject({ monto: '40' });
      expect(creada).toMatchObject({ estado: 'CONFIRMADA', venceEn: null });
      expect(datosCreados()).toMatchObject({ confirmadaEn: AHORA });
    });

    it('registra un uso por crédito y descuenta cada saldo', async () => {
      creditos('5', '10', '30');
      tarifas.calcularTurno.mockResolvedValue({
        valor: new Prisma.Decimal('24.00'),
        adelanto: new Prisma.Decimal('12.00'),
      });
      await servicio.crear(JUGADOR_ID, conCredito);
      expect(textos(prisma.creditoUso.create)).toEqual([
        { creditoId: 1, pagoId: 30, monto: '5' },
        { creditoId: 2, pagoId: 30, monto: '7' },
      ]);
      expect(
        prisma.credito.update.mock.calls.map(
          ([arg]: [
            {
              where: { id: number };
              data: { saldo: { decrement: Prisma.Decimal } };
            },
          ]) => [arg.where.id, arg.data.saldo.decrement.toFixed(2)],
        ),
      ).toEqual([
        [1, '5.00'],
        [2, '7.00'],
      ]);
    });

    describe('con 2 pendientes', () => {
      beforeEach(() => {
        prisma.reserva.count.mockResolvedValue(2);
      });

      it('si el crédito cubre todo el adelanto crea la reserva confirmada sin contar pendientes', async () => {
        creditos('40');
        const creada = await servicio.crear(JUGADOR_ID, conCredito);
        expect(creada).toMatchObject({ estado: 'CONFIRMADA', venceEn: null });
        expect(prisma.reserva.count).not.toHaveBeenCalled();
      });

      it('si el crédito cubre una parte responde el límite sin crear', async () => {
        creditos('39.99');
        const error = await errorDe(servicio.crear(JUGADOR_ID, conCredito));
        expect(error).toBeInstanceOf(ConflictException);
        expect(
          ((error as ConflictException).getResponse() as { message: string })
            .message,
        ).toBe(MENSAJES_RESERVA.limitePendientes);
        expect(prisma.reserva.create).not.toHaveBeenCalled();
        expect(prisma.pago.create).not.toHaveBeenCalled();
        expect(prisma.credito.update).not.toHaveBeenCalled();
      });

      it('sin usarCredito responde el límite aunque tenga crédito', async () => {
        creditos('50');
        await expect(
          mensajeDe(servicio.crear(JUGADOR_ID, DATOS)),
        ).resolves.toBe(MENSAJES_RESERVA.limitePendientes);
        expect(prisma.credito.findMany).not.toHaveBeenCalled();
        expect(prisma.reserva.create).not.toHaveBeenCalled();
      });

      it('cuenta las pendientes después de bloquear y repartir los créditos', async () => {
        creditos('10');
        await errorDe(servicio.crear(JUGADOR_ID, conCredito));
        const [, bloqueoCreditos] = prisma.$queryRaw.mock.invocationCallOrder;
        const [lectura] = prisma.credito.findMany.mock.invocationCallOrder;
        const [conteo] = prisma.reserva.count.mock.invocationCallOrder;
        expect(bloqueoCreditos).toBeLessThan(conteo);
        expect(lectura).toBeLessThan(conteo);
      });
    });

    it('con usarCredito y sin créditos no crea pago', async () => {
      const creada = await servicio.crear(JUGADOR_ID, conCredito);
      expect(prisma.pago.create).not.toHaveBeenCalled();
      expect(prisma.creditoUso.create).not.toHaveBeenCalled();
      expect(creada.estado).toBe('PENDIENTE_PAGO');
    });

    it('la auditoría registra el crédito aplicado', async () => {
      creditos('12.5');
      await servicio.crear(JUGADOR_ID, conCredito);
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          detalle: expect.objectContaining({ creditoAplicado: 12.5 }) as object,
        }),
        prisma,
      );
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
        soloConCredito: false,
        minutosParaPagar: 15,
        regla: {
          horasAnticipacion: 24,
          tipoCompensacion: 'CREDITO',
          plazoLimite: '2026-10-19T23:00:00.000Z',
          plazoVencido: false,
        },
      });
      expect(prisma.credito.aggregate).toHaveBeenCalledWith({
        where: { jugadorId: JUGADOR_ID, saldo: { gt: 0 } },
        _sum: { saldo: true },
      });
    });

    describe('plazo vencido según el reloj', () => {
      const PLAZO = new Date('2026-10-19T23:00:00.000Z');
      const reglaDe = async () =>
        (await servicio.resumen(JUGADOR_ID, DATOS)).regla;

      it('antes del plazo no está vencido', async () => {
        reloj.ahora.mockReturnValue(new Date(PLAZO.getTime() - 60_000));
        await expect(reglaDe()).resolves.toMatchObject({ plazoVencido: false });
      });

      it('justo en el plazo todavía no está vencido', async () => {
        reloj.ahora.mockReturnValue(PLAZO);
        await expect(reglaDe()).resolves.toMatchObject({ plazoVencido: false });
      });

      it('después del plazo está vencido', async () => {
        reloj.ahora.mockReturnValue(new Date(PLAZO.getTime() + 1));
        await expect(reglaDe()).resolves.toMatchObject({
          plazoLimite: PLAZO.toISOString(),
          plazoVencido: true,
        });
      });

      it('con 0 horas el plazo es el inicio del turno y no está vencido', async () => {
        prisma.reglaCancelacion.findUniqueOrThrow.mockResolvedValue({
          id: 1,
          horasAnticipacion: 0,
          tipoCompensacion: 'CREDITO',
        });
        reloj.ahora.mockReturnValue(new Date(INICIO_EN.getTime() - 60_000));
        await expect(reglaDe()).resolves.toMatchObject({
          plazoLimite: INICIO_EN.toISOString(),
          plazoVencido: false,
        });
      });
    });

    it('sin créditos el disponible es 0', async () => {
      await expect(servicio.resumen(JUGADOR_ID, DATOS)).resolves.toMatchObject({
        creditoDisponible: 0,
      });
    });

    describe('con 2 pendientes', () => {
      beforeEach(() => {
        prisma.reserva.count.mockResolvedValue(2);
      });

      it('si el crédito cubre el adelanto avisa que solo puede reservar con crédito', async () => {
        prisma.credito.aggregate.mockResolvedValue({
          _sum: { saldo: new Prisma.Decimal('40.00') },
        });
        await expect(
          servicio.resumen(JUGADOR_ID, DATOS),
        ).resolves.toMatchObject({
          creditoDisponible: 40,
          soloConCredito: true,
        });
      });

      it('si el crédito no cubre el adelanto responde el límite', async () => {
        prisma.credito.aggregate.mockResolvedValue({
          _sum: { saldo: new Prisma.Decimal('39.99') },
        });
        const error = await errorDe(servicio.resumen(JUGADOR_ID, DATOS));
        expect(error).toBeInstanceOf(ConflictException);
        expect(
          ((error as ConflictException).getResponse() as { message: string })
            .message,
        ).toBe(MENSAJES_RESERVA.limitePendientes);
      });

      it('con crédito suficiente sigue avisando si el turno está tomado', async () => {
        prisma.credito.aggregate.mockResolvedValue({
          _sum: { saldo: new Prisma.Decimal('40.00') },
        });
        prisma.reserva.findFirst.mockResolvedValue({ id: 1 });
        await expect(
          mensajeDe(servicio.resumen(JUGADOR_ID, DATOS)),
        ).resolves.toBe(MENSAJES_RESERVA.turnoNoDisponible);
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
      valorTurno: new Prisma.Decimal('80.00'),
      adelantoMinimo: new Prisma.Decimal('40.00'),
      cancha: { id: 2, nombre: 'Cancha 2', tamano: 'FUTBOL_5' },
    });
    const suma = (reservaId: number, concepto: string, monto: string) => ({
      reservaId,
      concepto,
      _sum: { monto: new Prisma.Decimal(monto) },
    });

    beforeEach(() => {
      prisma.pago.groupBy.mockResolvedValue([]);
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
        valorTurno: 80,
        adelantoMinimo: 40,
        adelantoPagado: 0,
        saldoPendiente: 80,
      });
      expect(prisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { jugadorId: JUGADOR_ID } }),
      );
    });

    it('arma los montos de cada reserva con sus pagos aprobados', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(1, '2026-10-20T23:00:00.000Z', '2026-10-21T00:00:00.000Z'),
        reserva(2, '2026-10-21T23:00:00.000Z', '2026-10-22T00:00:00.000Z'),
        reserva(3, '2026-10-22T23:00:00.000Z', '2026-10-23T00:00:00.000Z'),
      ]);
      prisma.pago.groupBy.mockResolvedValue([
        suma(1, 'ADELANTO', '40.00'),
        suma(2, 'ADELANTO', '40.00'),
        suma(2, 'SALDO', '40.00'),
        suma(3, 'ADELANTO', '12.35'),
        suma(3, 'ADICIONALES', '15.00'),
      ]);
      const mias = await servicio.mias(JUGADOR_ID);
      expect(
        mias.map(
          ({
            id,
            valorTurno,
            adelantoMinimo,
            adelantoPagado,
            saldoPendiente,
          }) => ({
            id,
            valorTurno,
            adelantoMinimo,
            adelantoPagado,
            saldoPendiente,
          }),
        ),
      ).toEqual([
        {
          id: 1,
          valorTurno: 80,
          adelantoMinimo: 40,
          adelantoPagado: 40,
          saldoPendiente: 40,
        },
        {
          id: 2,
          valorTurno: 80,
          adelantoMinimo: 40,
          adelantoPagado: 40,
          saldoPendiente: 0,
        },
        {
          id: 3,
          valorTurno: 80,
          adelantoMinimo: 40,
          adelantoPagado: 12.35,
          saldoPendiente: 67.65,
        },
      ]);
    });

    it('solo cuenta los pagos aprobados, no los pendientes de validación ni los rechazados', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(1, '2026-10-20T23:00:00.000Z', '2026-10-21T00:00:00.000Z'),
      ]);
      await servicio.mias(JUGADOR_ID);
      const [consulta] = prisma.pago.groupBy.mock.calls[0] as [
        { where: { estado: unknown } },
      ];
      expect(consulta.where.estado).toBe('APROBADO');
    });

    it('trae los pagos de todas sus reservas en una sola consulta', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(1, '2026-10-20T23:00:00.000Z', '2026-10-21T00:00:00.000Z'),
        reserva(2, '2026-10-21T23:00:00.000Z', '2026-10-22T00:00:00.000Z'),
        reserva(3, '2026-10-10T23:00:00.000Z', '2026-10-11T00:00:00.000Z'),
      ]);
      await servicio.mias(JUGADOR_ID);
      expect(prisma.pago.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.pago.groupBy).toHaveBeenCalledWith({
        by: ['reservaId', 'concepto'],
        where: { reservaId: { in: [1, 2, 3] }, estado: 'APROBADO' },
        _sum: { monto: true },
      });
    });

    it('sin reservas no consulta los pagos', async () => {
      prisma.reserva.findMany.mockResolvedValue([]);
      await expect(servicio.mias(JUGADOR_ID)).resolves.toEqual([]);
      expect(prisma.pago.groupBy).not.toHaveBeenCalled();
    });
  });
});
