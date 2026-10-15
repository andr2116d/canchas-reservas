import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  MENSAJE_CORREO_DUPLICADO,
  MENSAJE_DOCUMENTO_DUPLICADO,
} from '../src/modules/usuarios/usuarios.service';

const DOMINIO = '@registro.test';
const CONTRASENA = 'Cancha2026';

describe('Registro de jugador (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let secuencia = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const registrar = (cuerpo: Record<string, unknown>) =>
    request(servidor()).post('/api/auth/registro').send(cuerpo);

  /** Datos válidos únicos por correo y por documento. */
  function datos(extra: Record<string, unknown> = {}) {
    secuencia += 1;
    return {
      nombres: 'Lucía',
      apellidos: 'Ramírez Torres',
      tipoDocumento: 'DNI',
      numeroDocumento: `97${String(secuencia).padStart(6, '0')}`,
      correo: `jugador${secuencia}${DOMINIO}`,
      telefono: '987654321',
      contrasena: CONTRASENA,
      ...extra,
    };
  }

  const cantidadDe = (correo: string) =>
    prisma.usuario.count({
      where: { correo: correo.trim().toLowerCase() },
    });

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
    await prisma.usuario.deleteMany({
      where: { correo: { endsWith: DOMINIO, mode: 'insensitive' } },
    });
    await app.close();
  });

  describe('datos válidos', () => {
    it('crea un JUGADOR activo con la contraseña cifrada', async () => {
      const cuerpo = datos();

      const res = await registrar(cuerpo).expect(201);

      expect(res.body).toEqual({
        id: expect.any(Number),
        nombres: 'Lucía',
        apellidos: 'Ramírez Torres',
        correo: cuerpo.correo,
        rol: 'JUGADOR',
      });
      expect(res.body).not.toHaveProperty('passwordHash');

      const guardado = await prisma.usuario.findUniqueOrThrow({
        where: { correo: cuerpo.correo },
      });
      expect(guardado.rol).toBe('JUGADOR');
      expect(guardado.estado).toBe('ACTIVO');
      expect(guardado.passwordHash).not.toBe(CONTRASENA);
      await expect(
        compare(CONTRASENA, guardado.passwordHash as string),
      ).resolves.toBe(true);
    });

    it('guarda los nombres y apellidos sin espacios al inicio ni al final', async () => {
      const cuerpo = datos({ nombres: '  Lucía  ', apellidos: ' Ramírez ' });

      await registrar(cuerpo).expect(201);

      const guardado = await prisma.usuario.findUniqueOrThrow({
        where: { correo: cuerpo.correo },
      });
      expect(guardado.nombres).toBe('Lucía');
      expect(guardado.apellidos).toBe('Ramírez');
    });
  });

  describe('duplicados', () => {
    it('con el correo repetido en mayúsculas responde 409 en correo', async () => {
      const original = datos();
      await registrar(original).expect(201);

      const repetido = datos({
        correo: `  ${original.correo.toUpperCase()}  `,
      });
      const res = await registrar(repetido).expect(409);

      expect(res.body).toMatchObject({
        statusCode: 409,
        message: MENSAJE_CORREO_DUPLICADO,
        errores: { correo: MENSAJE_CORREO_DUPLICADO },
      });
      expect(await cantidadDe(repetido.correo as string)).toBe(1);
    });

    it('con el documento repetido responde 409 en numeroDocumento', async () => {
      const numeroDocumento = '97000099';
      await registrar(datos({ numeroDocumento })).expect(201);

      const repetido = datos({ numeroDocumento });
      const res = await registrar(repetido).expect(409);

      expect(res.body).toMatchObject({
        statusCode: 409,
        message: MENSAJE_DOCUMENTO_DUPLICADO,
        errores: { numeroDocumento: MENSAJE_DOCUMENTO_DUPLICADO },
      });
      await expect(
        prisma.usuario.count({ where: { numeroDocumento } }),
      ).resolves.toBe(1);
    });

    it('con correo y documento repetidos devuelve los dos errores', async () => {
      const numeroDocumento = '97000098';
      const original = datos({ numeroDocumento });
      await registrar(original).expect(201);

      const res = await registrar(
        datos({ numeroDocumento, correo: original.correo }),
      ).expect(409);

      expect(res.body.errores).toEqual({
        correo: MENSAJE_CORREO_DUPLICADO,
        numeroDocumento: MENSAJE_DOCUMENTO_DUPLICADO,
      });
      await expect(
        prisma.usuario.count({ where: { numeroDocumento } }),
      ).resolves.toBe(1);
    });
  });

  describe('datos inválidos', () => {
    it('con una contraseña de 7 caracteres responde 400 en contrasena', async () => {
      const cuerpo = datos({ contrasena: '1234567' });

      const res = await registrar(cuerpo).expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        errores: {
          contrasena: 'La contraseña debe tener al menos 8 caracteres',
        },
      });
      expect(await cantidadDe(cuerpo.correo as string)).toBe(0);
    });

    it('con un DNI de 7 dígitos responde 400 en numeroDocumento', async () => {
      const cuerpo = datos({ numeroDocumento: '7123456' });

      const res = await registrar(cuerpo).expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        errores: { numeroDocumento: 'El DNI debe tener 8 dígitos' },
      });
      expect(await cantidadDe(cuerpo.correo as string)).toBe(0);
    });

    it('con un correo sin @ responde 400 en correo', async () => {
      const cuerpo = datos({ correo: 'lucia.correo' });

      const res = await registrar(cuerpo).expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        errores: { correo: 'Ingresa un correo válido' },
      });
      expect(await cantidadDe(cuerpo.correo as string)).toBe(0);
    });

    it('sin ningún campo responde 400 marcando cada campo obligatorio', async () => {
      const res = await registrar({}).expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        errores: {
          nombres: 'Este campo es obligatorio',
          apellidos: 'Este campo es obligatorio',
          tipoDocumento: 'Este campo es obligatorio',
          numeroDocumento: 'Este campo es obligatorio',
          correo: 'Este campo es obligatorio',
          telefono: 'Este campo es obligatorio',
          contrasena: 'Este campo es obligatorio',
        },
      });
    });
  });
});
