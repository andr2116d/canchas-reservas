import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Recepcionistas (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);
  const ADMIN = {
    correo: `admin.${sufijo}@laprevia.test`,
    contrasena: 'Admin12345',
  };
  const OTRO_RECEPCIONISTA = {
    correo: `recepcion.${sufijo}@laprevia.test`,
    contrasena: 'Recepcion123',
  };
  const NUEVO = {
    nombres: 'Lucía',
    apellidos: 'Ramírez Torres',
    tipoDocumento: 'CE',
    numeroDocumento: `N${sufijo}`,
    correo: `lucia.${sufijo}@laprevia.test`,
    telefono: '987654321',
    contrasena: 'Cancha2026',
  };

  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: number;
  let cookieAdmin: string;
  let cookieOtro: string;
  let creadoId: number;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const iniciarSesion = (credenciales: {
    correo: string;
    contrasena: string;
  }) => request(servidor()).post('/api/auth/login').send(credenciales);
  const cookieDe = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find(
      (c) => c.startsWith('sesion='),
    ) ?? '';
  const auditoriasDe = (where: Record<string, unknown>) =>
    prisma.auditoria.findMany({
      where: { entidad: 'RECEPCIONISTA', ...where },
      orderBy: { id: 'asc' },
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
        nombres: 'Admin Prueba',
        tipoDocumento: 'CE',
        numeroDocumento: `A${sufijo}`,
        correo: ADMIN.correo,
        telefono: '900000001',
        passwordHash: await hash(ADMIN.contrasena, 4),
        rol: 'ADMINISTRADOR',
      },
    });
    adminId = admin.id;
    await prisma.usuario.create({
      data: {
        nombres: 'Recepcion Prueba',
        tipoDocumento: 'CE',
        numeroDocumento: `R${sufijo}`,
        correo: OTRO_RECEPCIONISTA.correo,
        telefono: '900000002',
        passwordHash: await hash(OTRO_RECEPCIONISTA.contrasena, 4),
        rol: 'RECEPCIONISTA',
      },
    });

    cookieAdmin = cookieDe(await iniciarSesion(ADMIN).expect(200));
    cookieOtro = cookieDe(await iniciarSesion(OTRO_RECEPCIONISTA).expect(200));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/recepcionistas', () => {
    it('crea un recepcionista activo y deja CREAR en auditoría sin la contraseña', async () => {
      const res = await request(servidor())
        .post('/api/recepcionistas')
        .set('Cookie', cookieAdmin)
        .send(NUEVO)
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(Number),
        nombres: 'Lucía',
        apellidos: 'Ramírez Torres',
        tipoDocumento: 'CE',
        numeroDocumento: NUEVO.numeroDocumento,
        correo: NUEVO.correo,
        telefono: '987654321',
        estado: 'ACTIVO',
        creadoEn: expect.any(String),
      });
      creadoId = (res.body as { id: number }).id;

      const usuario = await prisma.usuario.findUniqueOrThrow({
        where: { id: creadoId },
      });
      expect(usuario.rol).toBe('RECEPCIONISTA');
      expect(usuario.passwordHash).not.toBe(NUEVO.contrasena);

      const [registro, ...resto] = await auditoriasDe({ entidadId: creadoId });
      expect(resto).toHaveLength(0);
      expect(registro).toMatchObject({ accion: 'CREAR', usuarioId: adminId });
      expect(JSON.stringify(registro.detalle)).not.toMatch(
        /contrasena|passwordHash|Cancha2026/,
      );
    });

    it('con correo repetido en otras mayúsculas responde 409 y no crea auditoría', async () => {
      const antes = await prisma.auditoria.count({
        where: { usuarioId: adminId },
      });

      const res = await request(servidor())
        .post('/api/recepcionistas')
        .set('Cookie', cookieAdmin)
        .send({
          ...NUEVO,
          numeroDocumento: `D${sufijo}`,
          correo: NUEVO.correo.toUpperCase(),
        })
        .expect(409);

      expect(res.body).toEqual({
        statusCode: 409,
        message: 'Este correo ya está registrado',
        errores: { correo: 'Este correo ya está registrado' },
      });
      expect(
        await prisma.auditoria.count({ where: { usuarioId: adminId } }),
      ).toBe(antes);
    });

    it('con documento repetido responde 409 en numeroDocumento', async () => {
      const res = await request(servidor())
        .post('/api/recepcionistas')
        .set('Cookie', cookieAdmin)
        .send({ ...NUEVO, correo: `otro.${sufijo}@laprevia.test` })
        .expect(409);

      expect(res.body).toMatchObject({
        errores: { numeroDocumento: 'Este documento ya está registrado' },
      });
    });

    it('con datos inválidos responde 400 con errores por campo', async () => {
      const res = await request(servidor())
        .post('/api/recepcionistas')
        .set('Cookie', cookieAdmin)
        .send({ ...NUEVO, correo: 'sin-arroba', contrasena: '1234567' })
        .expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        errores: {
          correo: 'Ingresa un correo válido',
          contrasena: 'La contraseña debe tener al menos 8 caracteres',
        },
      });
    });
  });

  describe('GET /api/recepcionistas', () => {
    it('lista recepcionistas sin passwordHash ni rol y filtra por estado', async () => {
      const res = await request(servidor())
        .get('/api/recepcionistas?estado=ACTIVO')
        .set('Cookie', cookieAdmin)
        .expect(200);

      const lista = res.body as Record<string, unknown>[];
      expect(lista.some((r) => r.id === creadoId)).toBe(true);
      expect(lista.every((r) => r.estado === 'ACTIVO')).toBe(true);
      expect(lista.some((r) => r.id === adminId)).toBe(false);
      expect(JSON.stringify(lista)).not.toMatch(/passwordHash|"rol"/);
    });
  });

  describe('PATCH /api/recepcionistas/:id', () => {
    it('guarda en el detalle solo los campos que cambiaron', async () => {
      const res = await request(servidor())
        .patch(`/api/recepcionistas/${creadoId}`)
        .set('Cookie', cookieAdmin)
        .send({ nombres: 'Lucía', telefono: '912345678', correo: NUEVO.correo })
        .expect(200);

      expect(res.body).toMatchObject({ telefono: '912345678' });
      const registros = await auditoriasDe({
        entidadId: creadoId,
        accion: 'EDITAR',
      });
      expect(registros).toHaveLength(1);
      expect(registros[0].detalle).toEqual({
        anterior: { telefono: '987654321' },
        nuevo: { telefono: '912345678' },
      });
    });

    it('sin cambios responde 200 y no crea auditoría', async () => {
      await request(servidor())
        .patch(`/api/recepcionistas/${creadoId}`)
        .set('Cookie', cookieAdmin)
        .send({ telefono: '912345678' })
        .expect(200);

      expect(
        await auditoriasDe({ entidadId: creadoId, accion: 'EDITAR' }),
      ).toHaveLength(1);
    });

    it('no acepta cambiar el rol', async () => {
      const res = await request(servidor())
        .patch(`/api/recepcionistas/${creadoId}`)
        .set('Cookie', cookieAdmin)
        .send({ rol: 'ADMINISTRADOR' })
        .expect(400);

      expect(res.body).toMatchObject({ errores: { rol: expect.any(String) } });
    });

    it('con un usuario que no es recepcionista o un id inválido responde 404', async () => {
      await request(servidor())
        .patch(`/api/recepcionistas/${adminId}`)
        .set('Cookie', cookieAdmin)
        .send({ telefono: '911111111' })
        .expect(404);
      await request(servidor())
        .patch('/api/recepcionistas/abc')
        .set('Cookie', cookieAdmin)
        .send({ telefono: '911111111' })
        .expect(404);
    });
  });

  describe('POST /api/recepcionistas/:id/restablecer-contrasena', () => {
    it('responde 204, registra la auditoría y la nueva contraseña sirve para entrar', async () => {
      await request(servidor())
        .post(`/api/recepcionistas/${creadoId}/restablecer-contrasena`)
        .set('Cookie', cookieAdmin)
        .send({ contrasena: 'NuevaClave2026' })
        .expect(204);

      const [registro] = await auditoriasDe({
        entidadId: creadoId,
        accion: 'RESTABLECER_CONTRASENA',
      });
      expect(registro).toMatchObject({ usuarioId: adminId, detalle: null });
      await iniciarSesion({
        correo: NUEVO.correo,
        contrasena: NUEVO.contrasena,
      }).expect(401);
      await iniciarSesion({
        correo: NUEVO.correo,
        contrasena: 'NuevaClave2026',
      }).expect(200);
    });
  });

  describe('PATCH /api/recepcionistas/:id/estado', () => {
    it('desactivar deja INACTIVO, audita DESACTIVAR y el usuario ya no entra', async () => {
      const login = await iniciarSesion({
        correo: NUEVO.correo,
        contrasena: 'NuevaClave2026',
      }).expect(200);
      const cookieNuevo = cookieDe(login);

      const res = await request(servidor())
        .patch(`/api/recepcionistas/${creadoId}/estado`)
        .set('Cookie', cookieAdmin)
        .send({ estado: 'INACTIVO' })
        .expect(200);

      expect(res.body).toMatchObject({ estado: 'INACTIVO' });
      const registros = await auditoriasDe({
        entidadId: creadoId,
        accion: 'DESACTIVAR',
      });
      expect(registros).toHaveLength(1);
      expect(registros[0].usuarioId).toBe(adminId);
      await iniciarSesion({
        correo: NUEVO.correo,
        contrasena: 'NuevaClave2026',
      }).expect(403);
      await request(servidor())
        .get('/api/auth/me')
        .set('Cookie', cookieNuevo)
        .expect(401);
    });

    it('pedir el estado que ya tiene responde 200 sin auditoría', async () => {
      await request(servidor())
        .patch(`/api/recepcionistas/${creadoId}/estado`)
        .set('Cookie', cookieAdmin)
        .send({ estado: 'INACTIVO' })
        .expect(200);

      expect(
        await auditoriasDe({ entidadId: creadoId, accion: 'DESACTIVAR' }),
      ).toHaveLength(1);
    });

    it('activar lo deja ACTIVO, audita ACTIVAR y puede volver a entrar', async () => {
      await request(servidor())
        .patch(`/api/recepcionistas/${creadoId}/estado`)
        .set('Cookie', cookieAdmin)
        .send({ estado: 'ACTIVO' })
        .expect(200);

      expect(
        await auditoriasDe({ entidadId: creadoId, accion: 'ACTIVAR' }),
      ).toHaveLength(1);
      await iniciarSesion({
        correo: NUEVO.correo,
        contrasena: 'NuevaClave2026',
      }).expect(200);
    });

    it('el administrador no puede desactivarse a sí mismo', async () => {
      await request(servidor())
        .patch(`/api/recepcionistas/${adminId}/estado`)
        .set('Cookie', cookieAdmin)
        .send({ estado: 'INACTIVO' })
        .expect(404);

      const admin = await prisma.usuario.findUniqueOrThrow({
        where: { id: adminId },
      });
      expect(admin.estado).toBe('ACTIVO');
    });
  });

  describe('permisos', () => {
    it('un RECEPCIONISTA recibe 403 en todos los endpoints', async () => {
      const antes = await auditoriasDe({ entidadId: creadoId });
      const llamadas = [
        () => request(servidor()).get('/api/recepcionistas'),
        () => request(servidor()).post('/api/recepcionistas').send(NUEVO),
        () =>
          request(servidor())
            .patch(`/api/recepcionistas/${creadoId}`)
            .send({ telefono: '955555555' }),
        () =>
          request(servidor())
            .patch(`/api/recepcionistas/${creadoId}/estado`)
            .send({ estado: 'INACTIVO' }),
        () =>
          request(servidor())
            .post(`/api/recepcionistas/${creadoId}/restablecer-contrasena`)
            .send({ contrasena: 'OtraClave2026' }),
      ];

      for (const llamada of llamadas) {
        const res = await llamada().set('Cookie', cookieOtro).expect(403);
        expect(res.body).toMatchObject({
          statusCode: 403,
          message: 'Acceso no autorizado',
        });
      }
      expect(await auditoriasDe({ entidadId: creadoId })).toHaveLength(
        antes.length,
      );
    });

    it('sin sesión responde 401', async () => {
      await request(servidor()).get('/api/recepcionistas').expect(401);
    });
  });
});
