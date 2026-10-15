import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const DOMINIO = '@indices.test';
const DNI_A = '98000001';
const DNI_B = '98000002';
const DOCUMENTOS_DE_PRUEBA = [DNI_A, DNI_B];

type TipoDocumentoUsuario = 'DNI' | 'CE';

interface CuerpoError {
  statusCode: number;
  message: string;
  errores: Record<string, string>;
}

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

function payloadRegistro(
  parcial: { numeroDocumento?: string; correo?: string } = {},
) {
  return {
    nombres: 'Lucía',
    apellidos: 'Ramírez Torres',
    tipoDocumento: 'DNI',
    numeroDocumento: DNI_A,
    correo: `lucia${DOMINIO}`,
    telefono: '987654321',
    contrasena: 'Cancha2026',
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
    app.useGlobalPipes(new ValidationPipe());
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

  describe('Bloque B: POST /api/auth/registro (supertest)', () => {
    async function registrarPrimero() {
      await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(payloadRegistro())
        .expect(201);
    }

    it('devuelve 409 en numeroDocumento si el documento ya existe', async () => {
      await registrarPrimero();

      const respuesta = await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(payloadRegistro({ correo: `otro${DOMINIO}` }))
        .expect(409);

      expect(respuesta.body as CuerpoError).toEqual({
        statusCode: 409,
        message: expect.any(String),
        errores: { numeroDocumento: 'Este documento ya está registrado' },
      });

      const total = await prisma.usuario.count({
        where: { numeroDocumento: DNI_A },
      });
      expect(total).toBe(1);
    });

    it('devuelve 409 en correo si el correo ya existe', async () => {
      await registrarPrimero();

      const respuesta = await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(payloadRegistro({ numeroDocumento: DNI_B }))
        .expect(409);

      expect(respuesta.body as CuerpoError).toEqual({
        statusCode: 409,
        message: expect.any(String),
        errores: { correo: 'Este correo ya está registrado' },
      });

      const total = await prisma.usuario.count({
        where: { numeroDocumento: { in: DOCUMENTOS_DE_PRUEBA } },
      });
      expect(total).toBe(1);
    });

    it('devuelve 409 en correo si solo cambian las mayúsculas', async () => {
      await registrarPrimero();

      const respuesta = await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(
          payloadRegistro({
            numeroDocumento: DNI_B,
            correo: 'LUCIA@Indices.TEST',
          }),
        )
        .expect(409);

      expect(respuesta.body as CuerpoError).toEqual({
        statusCode: 409,
        message: expect.any(String),
        errores: { correo: 'Este correo ya está registrado' },
      });

      const total = await prisma.usuario.count({
        where: { numeroDocumento: { in: DOCUMENTOS_DE_PRUEBA } },
      });
      expect(total).toBe(1);
    });

    it('devuelve 409 con ambos campos si documento y correo ya existen', async () => {
      await registrarPrimero();

      const respuesta = await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(payloadRegistro())
        .expect(409);

      expect(respuesta.body as CuerpoError).toEqual({
        statusCode: 409,
        message: expect.any(String),
        errores: {
          numeroDocumento: 'Este documento ya está registrado',
          correo: 'Este correo ya está registrado',
        },
      });

      const total = await prisma.usuario.count({
        where: { numeroDocumento: DNI_A },
      });
      expect(total).toBe(1);
    });
  });
});