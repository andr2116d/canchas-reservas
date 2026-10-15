import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const DOMINIO = '@indices.test';
const DNI_A = '98000001';
const DNI_B = '98000002';
const DOCUMENTOS_DE_PRUEBA = [DNI_A, DNI_B];

type TipoDocumentoUsuario = 'DNI' | 'CE';

function datosUsuario(
  parcial: {
    tipoDocumento?: TipoDocumentoUsuario;
    numeroDocumento?: string;
    correo?: string;
  } = {},
) {
  return {
    nombres: 'Lucía',
    apellidos: 'Ramírez Torres',
    tipoDocumento: 'DNI' as TipoDocumentoUsuario,
    numeroDocumento: DNI_A,
    correo: `lucia${DOMINIO}`,
    telefono: '987654321',
    passwordHash: 'hash-de-prueba',
    ...parcial,
  };
}

describe('Usuarios: índices únicos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function limpiar() {
    await prisma.usuario.deleteMany({
      where: {
        OR: [
          { correo: { endsWith: DOMINIO, mode: 'insensitive' } },
          { numeroDocumento: { in: DOCUMENTOS_DE_PRUEBA } },
        ],
      },
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await limpiar();
  });

  afterAll(async () => {
    await limpiar();
    await app.close();
  });

  describe('Bloque A: índices de la tabla (Prisma directo)', () => {
    it('rechaza el mismo tipo y número de documento con distinto correo', async () => {
      await prisma.usuario.create({ data: datosUsuario() });

      await expect(
        prisma.usuario.create({
          data: datosUsuario({ correo: `otro${DOMINIO}` }),
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      const total = await prisma.usuario.count({
        where: { numeroDocumento: DNI_A },
      });
      expect(total).toBe(1);
    });

    it('permite el mismo número de documento con distinto tipo', async () => {
      await prisma.usuario.create({ data: datosUsuario() });

      await expect(
        prisma.usuario.create({
          data: datosUsuario({
            tipoDocumento: 'CE',
            correo: `otro${DOMINIO}`,
          }),
        }),
      ).resolves.toBeDefined();

      const total = await prisma.usuario.count({
        where: { numeroDocumento: DNI_A },
      });
      expect(total).toBe(2);
    });

    it('rechaza el mismo correo con distinto documento', async () => {
      await prisma.usuario.create({ data: datosUsuario() });

      await expect(
        prisma.usuario.create({
          data: datosUsuario({ numeroDocumento: DNI_B }),
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      const total = await prisma.usuario.count({
        where: { correo: `lucia${DOMINIO}` },
      });
      expect(total).toBe(1);
    });

    it('permite dos usuarios con correo y documento distintos', async () => {
      await prisma.usuario.create({ data: datosUsuario() });

      await expect(
        prisma.usuario.create({
          data: datosUsuario({
            numeroDocumento: DNI_B,
            correo: `otro${DOMINIO}`,
          }),
        }),
      ).resolves.toBeDefined();

      const total = await prisma.usuario.count({
        where: { numeroDocumento: { in: DOCUMENTOS_DE_PRUEBA } },
      });
      expect(total).toBe(2);
    });
  });
});
