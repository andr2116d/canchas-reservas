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
  let app: INestApplication;
  let prisma: PrismaService;
  let original: ReglaCancelacion;

  const leerRegla = () =>
    prisma.reglaCancelacion.findUniqueOrThrow({ where: { id: 1 } });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    original = await leerRegla();
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
});
