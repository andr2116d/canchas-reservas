import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tabla adicional (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);

  let app: INestApplication;
  let prisma: PrismaService;
  const creados: number[] = [];

  const crearAdicional = async (nombre: string, precio: number | string) => {
    const adicional = await prisma.adicional.create({
      data: { nombre, precio },
    });
    creados.push(adicional.id);
    return adicional;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.adicional.deleteMany({ where: { id: { in: creados } } });
    creados.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('guarda dos adicionales con nombres distintos', async () => {
    await crearAdicional(`Gaseosa ${sufijo}`, 3);
    await crearAdicional(`Toalla ${sufijo}`, 4);

    await expect(
      prisma.adicional.count({ where: { nombre: { endsWith: sufijo } } }),
    ).resolves.toBe(2);
  });

  it.each(['agua', 'AGUA'])(
    'rechaza %s cuando ya existe Agua',
    async (variante) => {
      await crearAdicional(`Agua ${sufijo}`, 2.5);

      await expect(
        crearAdicional(`${variante} ${sufijo}`, 3),
      ).rejects.toMatchObject({ code: 'P2002' });
      await expect(
        prisma.adicional.count({
          where: {
            nombre: { equals: `agua ${sufijo}`, mode: 'insensitive' },
          },
        }),
      ).resolves.toBe(1);
    },
  );
});
