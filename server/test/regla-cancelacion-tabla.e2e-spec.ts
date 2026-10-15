import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import {
  Prisma,
  ReglaCancelacion,
  TipoCompensacion,
} from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

const violaCheck = (restriccion: string) => ({
  meta: {
    driverAdapterError: {
      cause: { code: '23514', message: expect.stringContaining(restriccion) },
    },
  },
});

describe('Tabla regla_cancelacion (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);

  let app: INestApplication;
  let prisma: PrismaService;
  let original: ReglaCancelacion;
  let jugadorId: number;
  let canchaId: number;
  let reservas = 0;

  const leerRegla = () =>
    prisma.reglaCancelacion.findUniqueOrThrow({ where: { id: 1 } });

  const crearReserva = (
    copia: Pick<
      Prisma.ReservaUncheckedCreateInput,
      'reglaHorasAnticipacion' | 'reglaTipoCompensacion'
    >,
  ) => {
    reservas += 1;
    const hora = String(7 + reservas).padStart(2, '0');
    return prisma.reserva.create({
      data: {
        codigo: `G${sufijo}${reservas}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId,
        fecha: new Date('2026-11-20'),
        horaInicio: `${hora}:00`,
        horaFin: `${hora}:59`,
        inicioEn: new Date(`2026-11-20T${hora}:00:00-05:00`),
        finEn: new Date(`2026-11-20T${hora}:59:00-05:00`),
        franja: 'DIA',
        valorTurno: 60,
        adelantoMinimo: 30,
        ...copia,
      },
    });
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    original = await leerRegla();

    const jugador = await prisma.usuario.create({
      data: {
        nombres: 'Jugador Tabla Regla',
        tipoDocumento: 'CE',
        numeroDocumento: `G${sufijo}`,
        correo: `jugador.tabla.regla.${sufijo}@laprevia.test`,
        telefono: '900000031',
        passwordHash: 'sin-uso',
      },
    });
    jugadorId = jugador.id;
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Tabla Regla ${sufijo}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
      },
    });
    canchaId = cancha.id;
  });

  afterEach(async () => {
    await prisma.reglaCancelacion.update({
      where: { id: 1 },
      data: {
        horasAnticipacion: original.horasAnticipacion,
        tipoCompensacion: original.tipoCompensacion,
      },
    });
  });

  afterAll(async () => {
    await prisma.reserva.deleteMany({ where: { jugadorId } });
    await prisma.cancha.deleteMany({ where: { id: canchaId } });
    await prisma.usuario.deleteMany({ where: { id: jugadorId } });
    await app.close();
  });

  it.each([-1, -24])('rechaza %s horas de anticipacion', async (horas) => {
    await expect(
      prisma.reglaCancelacion.update({
        where: { id: 1 },
        data: { horasAnticipacion: horas },
      }),
    ).rejects.toMatchObject(violaCheck('regla_horas_validas'));
    await expect(leerRegla()).resolves.toMatchObject({
      horasAnticipacion: original.horasAnticipacion,
    });
  });

  it('guarda 0 horas de anticipacion', async () => {
    await prisma.reglaCancelacion.update({
      where: { id: 1 },
      data: { horasAnticipacion: 0 },
    });

    await expect(leerRegla()).resolves.toMatchObject({ horasAnticipacion: 0 });
  });

  it('crea la regla con id 1, 24 horas y CREDITO por defecto', async () => {
    let creada: ReglaCancelacion | undefined;
    const deshacer = new Error('deshacer');

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.reglaCancelacion.delete({ where: { id: 1 } });
        creada = await tx.reglaCancelacion.create({ data: {} });
        throw deshacer;
      }),
    ).rejects.toBe(deshacer);

    expect(creada).toMatchObject({
      id: 1,
      horasAnticipacion: 24,
      tipoCompensacion: 'CREDITO',
    });
    expect(creada?.actualizadoEn).toBeInstanceOf(Date);
    await expect(leerRegla()).resolves.toMatchObject({
      horasAnticipacion: original.horasAnticipacion,
      tipoCompensacion: original.tipoCompensacion,
    });
  });

  it.each(['DEVOLUCION', 'CREDITO'] as const)(
    'guarda %s como tipo de compensacion',
    async (tipoCompensacion) => {
      await prisma.reglaCancelacion.update({
        where: { id: 1 },
        data: { tipoCompensacion },
      });

      await expect(leerRegla()).resolves.toMatchObject({ tipoCompensacion });
    },
  );

  it('Prisma rechaza un tipo de compensacion fuera del enum', async () => {
    await expect(
      prisma.reglaCancelacion.update({
        where: { id: 1 },
        data: { tipoCompensacion: 'RETENCION' as TipoCompensacion },
      }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientValidationError);
  });

  it('la base rechaza un tipo de compensacion fuera del enum', async () => {
    await expect(
      prisma.$executeRaw`UPDATE regla_cancelacion SET tipo_compensacion = 'RETENCION' WHERE id = 1`,
    ).rejects.toMatchObject({
      meta: { driverAdapterError: { cause: { originalCode: '22P02' } } },
    });
    await expect(leerRegla()).resolves.toMatchObject({
      tipoCompensacion: original.tipoCompensacion,
    });
  });

  it('el seed deja una sola regla con id 1', async () => {
    const reglas = await prisma.reglaCancelacion.findMany();

    expect(reglas).toHaveLength(1);
    expect(reglas[0].id).toBe(1);
  });

  it('rechaza una segunda regla con id 1', async () => {
    await expect(
      prisma.reglaCancelacion.create({ data: {} }),
    ).rejects.toMatchObject({ code: 'P2002' });
    await expect(prisma.reglaCancelacion.count()).resolves.toBe(1);
  });

  it('rechaza una regla con id distinto de 1', async () => {
    await expect(
      prisma.reglaCancelacion.create({ data: { id: 2 } }),
    ).rejects.toMatchObject(violaCheck('regla_fila_unica'));
    await expect(prisma.reglaCancelacion.count()).resolves.toBe(1);
  });

  it('la reserva conserva su copia de la regla cuando la regla cambia', async () => {
    const vigente = await leerRegla();
    const reserva = await crearReserva({
      reglaHorasAnticipacion: vigente.horasAnticipacion,
      reglaTipoCompensacion: vigente.tipoCompensacion,
    });

    await prisma.reglaCancelacion.update({
      where: { id: 1 },
      data: {
        horasAnticipacion: vigente.horasAnticipacion + 12,
        tipoCompensacion:
          vigente.tipoCompensacion === 'CREDITO' ? 'DEVOLUCION' : 'CREDITO',
      },
    });

    await expect(
      prisma.reserva.findUniqueOrThrow({ where: { id: reserva.id } }),
    ).resolves.toMatchObject({
      reglaHorasAnticipacion: vigente.horasAnticipacion,
      reglaTipoCompensacion: vigente.tipoCompensacion,
    });
  });

  it('la reserva exige la copia de la regla', async () => {
    await expect(
      crearReserva({} as Parameters<typeof crearReserva>[0]),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientValidationError);
    await expect(
      prisma.reserva.count({ where: { codigo: `G${sufijo}${reservas}` } }),
    ).resolves.toBe(0);
  });

  it('rechaza una copia de la regla con horas negativas', async () => {
    await expect(
      crearReserva({
        reglaHorasAnticipacion: -1,
        reglaTipoCompensacion: 'CREDITO',
      }),
    ).rejects.toMatchObject(violaCheck('reserva_regla_horas_validas'));
    await expect(
      prisma.reserva.count({ where: { codigo: `G${sufijo}${reservas}` } }),
    ).resolves.toBe(0);
  });
});
