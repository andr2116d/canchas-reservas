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
});
