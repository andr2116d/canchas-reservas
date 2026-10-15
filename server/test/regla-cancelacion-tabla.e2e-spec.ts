import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { ReglaCancelacion } from '../src/generated/prisma/client';
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
});
