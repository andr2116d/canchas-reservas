import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaRecepcionistaValida } from '../fabricas/datos-recepcionista';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  iniciarSesion,
  sesionDeAdministrador,
  sesionDeJugador,
  confirmarDatosDelPersonal,
} from '../../compartido/soporte/sesiones-de-prueba';

const RUTA = '/api/recepcionistas';
const CORREO = 'rosa.quispe@laprevia.pe';

describe('POST /api/recepcionistas', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const crear = (cuerpo: object = unaRecepcionistaValida()) =>
    request(app.getHttpServer()).post(RUTA).send(cuerpo);

  describe('acceso', () => {
    it('responde 401 sin sesión', async () => {
      await crear().expect(401);
    });

    it('responde 403 a un jugador', async () => {
      const jugador = await sesionDeJugador(app);

      await crear().set('Cookie', jugador).expect(403);
    });

    it('responde 403 a un administrador que no cambió su contraseña temporal', async () => {
      await sesionDeAdministrador(app, 'otra.admin@laprevia.pe');
      const temporal = cookieDe(
        await iniciarSesion(app, 'otra.admin@laprevia.pe', 'definitiva2026'),
      );
      await prisma.usuario.updateMany({
        where: { rol: 'ADMINISTRADOR' },
        data: { requiereCambiarContrasena: true },
      });

      await crear().set('Cookie', temporal).expect(403);
    });

    it('responde 403 a una recepcionista', async () => {
      await crear().set('Cookie', administrador).expect(201);
      await confirmarDatosDelPersonal(app);
      const recepcion = cookieDe(
        await iniciarSesion(app, CORREO, 'temporal2026'),
      );
      await request(app.getHttpServer())
        .patch('/api/sesiones/contrasena-temporal')
        .set('Cookie', recepcion)
        .send({ contrasena: 'definitiva2026' });
      const completa = cookieDe(
        await iniciarSesion(app, CORREO, 'definitiva2026'),
      );

      await crear(
        unaRecepcionistaValida({
          numeroDocumento: '47654321',
          usuarioDeCorreo: 'otra',
        }),
      )
        .set('Cookie', completa)
        .expect(403);
    });
  });

  describe('alta', () => {
    it('responde 201 con el id y guarda los datos personales cifrados', async () => {
      const respuesta = await crear().set('Cookie', administrador).expect(201);

      const fila = await prisma.usuario.findUniqueOrThrow({
        where: { id: respuesta.body.id },
      });
      expect(fila.rol).toBe('RECEPCIONISTA');
      expect(fila.requiereCambiarContrasena).toBe(true);
      for (const [cifrado, claro] of [
        [fila.nombresCifrado, 'Rosa'],
        [fila.numeroDocumentoCifrado, '41234567'],
        [fila.celularCifrado, '912345678'],
        [fila.correoCifrado, CORREO],
      ]) {
        expect(cifrado).not.toContain(claro);
      }
      expect(fila.contrasenaHash).toMatch(/^\$argon2id\$/);
    });

    it('deja el alta en la auditoría con el administrador que la hizo', async () => {
      const antes = new Date();
      const { body } = await crear().set('Cookie', administrador).expect(201);

      const [registro] = await prisma.registroAuditoria.findMany({
        include: { ejecutadoPor: true },
      });
      expect(registro.accion).toBe('ALTA');
      expect(registro.usuarioAfectadoId).toBe(body.id);
      expect(registro.ejecutadoPor.rol).toBe('ADMINISTRADOR');
      expect(registro.ocurridoEn.getTime()).toBeGreaterThanOrEqual(
        antes.getTime(),
      );
    });

    it('la recepcionista entra con su correo institucional y debe cambiar la contraseña', async () => {
      await crear().set('Cookie', administrador).expect(201);
      await confirmarDatosDelPersonal(app);

      const inicio = await iniciarSesion(app, CORREO, 'temporal2026');

      expect(inicio.status).toBe(200);
      expect(inicio.body).toEqual({
        rol: 'RECEPCIONISTA',
        requiereCompletarDatos: false,
        requiereCambiarContrasena: true,
        contrasenaTemporalVenceEn: expect.any(String),
      });
    });

    it('permite el documento de una persona que ya tiene cuenta de jugador', async () => {
      await sesionDeJugador(app);

      await crear(unaRecepcionistaValida({ numeroDocumento: '45678912' }))
        .set('Cookie', administrador)
        .expect(201);
    });
  });

  describe('duplicados y reactivación', () => {
    it('responde 409 si el documento o el correo ya son de una recepcionista activa', async () => {
      await crear().set('Cookie', administrador).expect(201);

      const repetida = await crear().set('Cookie', administrador).expect(409);

      expect(repetida.body.errores).toEqual({
        numeroDocumento:
          'Este documento ya tiene una cuenta de recepción activa.',
        correo: 'Este correo ya fue registrado para otra cuenta del personal.',
      });
      expect(
        await prisma.usuario.count({ where: { rol: 'RECEPCIONISTA' } }),
      ).toBe(1);
    });

    it('responde 409 con la cuenta a reactivar si coincide con una desactivada', async () => {
      const { body } = await crear().set('Cookie', administrador).expect(201);
      await prisma.usuario.update({
        where: { id: body.id },
        data: { estado: 'INACTIVO' },
      });

      const respuesta = await crear().set('Cookie', administrador).expect(409);

      expect(respuesta.body).toEqual({
        mensaje:
          'Esta persona ya tuvo una cuenta de recepción. Reactívala para recuperar sus datos.',
        errores: {},
        datos: { reactivable: { id: body.id, nombres: 'Rosa' } },
      });
      expect(
        await prisma.usuario.count({ where: { rol: 'RECEPCIONISTA' } }),
      ).toBe(1);
    });
  });

  describe('validación', () => {
    it('responde 400 con el mensaje de cada dato inválido y no guarda nada', async () => {
      const respuesta = await crear(
        unaRecepcionistaValida({
          usuarioDeCorreo: 'rosa@gmail.com',
          fechaNacimiento: '2012-01-01',
        }),
      )
        .set('Cookie', administrador)
        .expect(400);

      expect(Object.keys(respuesta.body.errores)).toEqual([
        'fechaNacimiento',
        'correo',
      ]);
      expect(
        await prisma.usuario.count({ where: { rol: 'RECEPCIONISTA' } }),
      ).toBe(0);
    });

    it('rechaza campos que no son del alta, como el rol', async () => {
      await crear({ ...unaRecepcionistaValida(), rol: 'ADMINISTRADOR' })
        .set('Cookie', administrador)
        .expect(400);
    });
  });
});
