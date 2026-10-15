import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { Prisma } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tabla tarifa (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);

  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: number;
  let canchaId: number;

  const crearTarifa = (
    franja: 'DIA' | 'NOCHE',
    valor: number | string,
    vigenteHasta: Date | null = null,
  ) =>
    prisma.tarifa.create({
      data: { canchaId, franja, valor, vigenteHasta, creadoPorId: adminId },
    });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);

    const admin = await prisma.usuario.create({
      data: {
        nombres: 'Admin Tabla Tarifa',
        tipoDocumento: 'CE',
        numeroDocumento: `T${sufijo}`,
        correo: `admin.tabla.tarifa.${sufijo}@laprevia.test`,
        telefono: '900000021',
        passwordHash: 'sin-uso',
        rol: 'ADMINISTRADOR',
      },
    });
    adminId = admin.id;
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Tabla Tarifa ${sufijo}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
      },
    });
    canchaId = cancha.id;
  });

  afterAll(async () => {
    await prisma.tarifa.deleteMany({ where: { canchaId } });
    await prisma.cancha.deleteMany({ where: { id: canchaId } });
    await prisma.usuario.deleteMany({ where: { id: adminId } });
    await app.close();
  });

  it('rechaza una segunda tarifa vigente para la misma cancha y franja', async () => {
    await crearTarifa('DIA', 50);

    await expect(crearTarifa('DIA', 60)).rejects.toMatchObject({
      code: 'P2002',
    });
    await expect(
      prisma.tarifa.count({
        where: { canchaId, franja: 'DIA', vigenteHasta: null },
      }),
    ).resolves.toBe(1);
  });

  it('permite una vigente por franja en la misma cancha', async () => {
    await expect(crearTarifa('NOCHE', 80)).resolves.toMatchObject({
      franja: 'NOCHE',
    });
  });

  it('permite varias tarifas cerradas junto a la vigente', async () => {
    await crearTarifa('DIA', 40, new Date('2026-01-01T00:00:00.000Z'));
    await crearTarifa('DIA', 45, new Date('2026-02-01T00:00:00.000Z'));

    await expect(
      prisma.tarifa.count({ where: { canchaId, franja: 'DIA' } }),
    ).resolves.toBe(3);
  });

  it.each([0, -10, '0.00'])('rechaza el valor %s', async (valor) => {
    await expect(crearTarifa('NOCHE', valor, new Date())).rejects.toMatchObject(
      {
        meta: {
          driverAdapterError: {
            cause: {
              code: '23514',
              message: expect.stringContaining('tarifa_valor_positivo'),
            },
          },
        },
      },
    );
    await expect(
      prisma.tarifa.count({ where: { canchaId, valor: { lte: 0 } } }),
    ).resolves.toBe(0);
  });

  it('acepta el valor mínimo de un céntimo y guarda 2 decimales', async () => {
    const tarifa = await crearTarifa('NOCHE', '0.01', new Date());

    expect(tarifa.valor).toBeInstanceOf(Prisma.Decimal);
    expect(tarifa.valor.toFixed(2)).toBe('0.01');
  });

  it('cerrar la vigente conserva el historial y permite una nueva', async () => {
    const ahora = new Date();
    await prisma.tarifa.updateMany({
      where: { canchaId, franja: 'DIA', vigenteHasta: null },
      data: { vigenteHasta: ahora },
    });
    await crearTarifa('DIA', 55.05);

    const dia = await prisma.tarifa.findMany({
      where: { canchaId, franja: 'DIA' },
      orderBy: { id: 'asc' },
    });
    expect(dia.map((t) => t.valor.toFixed(2))).toEqual([
      '50.00',
      '40.00',
      '45.00',
      '55.05',
    ]);
    expect(dia.filter((t) => t.vigenteHasta === null)).toHaveLength(1);
    expect(dia[0].vigenteHasta).toEqual(ahora);
  });
});
