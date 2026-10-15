import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { Prisma } from '../src/generated/prisma/client';
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

  it.each([0, -5, '0.00'])('rechaza el precio %s', async (precio) => {
    await expect(
      crearAdicional(`Precio ${sufijo}`, precio),
    ).rejects.toMatchObject({
      meta: {
        driverAdapterError: {
          cause: {
            code: '23514',
            message: expect.stringContaining('adicional_precio_positivo'),
          },
        },
      },
    });
    await expect(
      prisma.adicional.count({ where: { nombre: `Precio ${sufijo}` } }),
    ).resolves.toBe(0);
  });

  it.each([
    ['0.01', '0.01'],
    ['9999.99', '9999.99'],
    [7, '7.00'],
    ['12.345', '12.35'],
  ])('guarda el precio %s como %s', async (precio, guardado) => {
    const { id } = await crearAdicional(`Precio ${sufijo}`, precio);

    const adicional = await prisma.adicional.findUniqueOrThrow({
      where: { id },
    });
    expect(adicional.precio).toBeInstanceOf(Prisma.Decimal);
    expect(adicional.precio.toFixed(2)).toBe(guardado);
    expect(adicional.precio.decimalPlaces()).toBeLessThanOrEqual(2);
  });
});
