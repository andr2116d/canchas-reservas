import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { FORMATO_HORA } from '../src/modules/horario/dto/dia-horario.dto';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tablas horario_dia y configuracion (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('el seed deja un registro por cada día de la semana del 1 al 7', async () => {
    const dias = await prisma.horarioDia.findMany({
      orderBy: { diaSemana: 'asc' },
    });

    expect(dias.map((dia) => dia.diaSemana)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('los días abiertos tienen horas HH:mm con cierre posterior y los cerrados no generan horas', async () => {
    const dias = await prisma.horarioDia.findMany();

    for (const dia of dias) {
      if (dia.abierto) {
        expect(dia.apertura).toMatch(FORMATO_HORA);
        expect(dia.cierre).toMatch(FORMATO_HORA);
        expect(dia.cierre! > dia.apertura!).toBe(true);
      } else {
        expect([dia.apertura, dia.cierre]).toEqual([null, null]);
      }
    }
  });

  it('la base no permite dos registros para el mismo día', async () => {
    await expect(
      prisma.horarioDia.create({ data: { diaSemana: 1 } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('existe la configuración única con inicio de noche HH:mm', async () => {
    const configuraciones = await prisma.configuracion.findMany();

    expect(configuraciones).toHaveLength(1);
    expect(configuraciones[0].id).toBe(1);
    expect(configuraciones[0].inicioNoche).toMatch(FORMATO_HORA);
  });

  it('la base no permite una configuración con id distinto de 1', async () => {
    await expect(
      prisma.configuracion.create({ data: { id: 2 } }),
    ).rejects.toMatchObject({
      meta: {
        driverAdapterError: {
          cause: {
            code: '23514',
            message: expect.stringContaining('configuracion_fila_unica'),
          },
        },
      },
    });
    await expect(prisma.configuracion.count()).resolves.toBe(1);
  });
});
