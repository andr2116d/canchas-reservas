import { ConflictException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CanchasService } from '../src/modules/canchas/canchas.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tabla cancha (e2e, contra Postgres)', () => {
  const nombre = `Prueba Unica ${Date.now()}`;
  let prisma: PrismaService;
  let canchas: CanchasService;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [CanchasService],
    }).compile();
    await modulo.init();
    prisma = modulo.get(PrismaService);
    canchas = modulo.get(CanchasService);
  });

  afterAll(async () => {
    await prisma.cancha.deleteMany({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    await prisma.$disconnect();
  });

  it('una cancha nueva queda OPERATIVA y activa', async () => {
    const cancha = await canchas.crear({
      nombre,
      tamano: 'FUTBOL_5',
      iluminacion: true,
    });
    expect(cancha).toMatchObject({ estado: 'OPERATIVA', activa: true });
  });

  it('la base rechaza el mismo nombre con otras mayúsculas', async () => {
    await expect(
      prisma.cancha.create({
        data: {
          nombre: nombre.toUpperCase(),
          tamano: 'FUTBOL_7',
          iluminacion: false,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('el service lo devuelve como 409', async () => {
    await expect(
      canchas.crear({
        nombre: nombre.toLowerCase(),
        tamano: 'FUTBOL_5',
        iluminacion: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
