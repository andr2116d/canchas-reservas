import { createHash } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { GENERADOR_TOKEN_SESION } from '../../../src/modulos/sesiones/aplicacion/generador-token-sesion.port';
import { CryptoGeneradorTokenSesionAdapter } from '../../../src/modulos/sesiones/infraestructura/seguridad/crypto-generador-token-sesion.adapter';
import { unJugadorValido } from '../../usuarios/fabricas/datos-registro-jugador';
import { cookieDeSesion } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';

function tokenDe(cookie: string): string {
  return cookie.split(';')[0].replace('sesion=', '');
}

describe('Sesión del jugador', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const registrar = () =>
    request(app.getHttpServer()).post('/api/jugadores').send(unJugadorValido());
  const consultarCuenta = (cookie?: string) => {
    const solicitud = request(app.getHttpServer()).get('/api/cuenta');
    return cookie ? solicitud.set('Cookie', cookie) : solicitud;
  };

  describe('al registrarse', () => {
    it('revierte el alta si falla la escritura de la sesión y permite reintentar', async () => {
      await app.close();
      const generador = new CryptoGeneradorTokenSesionAdapter();
      const tokenRepetido = generador.generar();
      let intentos = 0;
      ({ app, prisma } = await crearAppDePrueba((constructor) =>
        constructor.overrideProvider(GENERADOR_TOKEN_SESION).useValue({
          generar: () =>
            ++intentos <= 2 ? tokenRepetido : generador.generar(),
          hashear: (token: string) => generador.hashear(token),
        }),
      ));
      expect((await registrar()).status).toBe(201);
      const otroJugador = unJugadorValido({
        correo: 'otro.jugador@gmail.com',
        numeroDocumento: '12345678',
      });
      const registrarOtro = () =>
        request(app.getHttpServer()).post('/api/jugadores').send(otroJugador);

      const fallido = await registrarOtro();

      expect(fallido.status).toBe(500);
      expect(fallido.headers['set-cookie']).toBeUndefined();
      expect(await prisma.usuario.count()).toBe(1);
      expect(await prisma.sesion.count()).toBe(1);
      expect((await registrarOtro()).status).toBe(201);
      expect(await prisma.usuario.count()).toBe(2);
      expect(await prisma.sesion.count()).toBe(2);
    });

    it('deja la sesión iniciada con una cookie httpOnly y SameSite=Lax', async () => {
      const respuesta = await registrar();

      const cookie = cookieDeSesion(respuesta.headers);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Path=\//);
      expect(cookie).toMatch(/Expires=/);
    });

    it('guarda solo el hash del token, nunca el token', async () => {
      const token = tokenDe(cookieDeSesion((await registrar()).headers));

      const sesion = await prisma.sesion.findFirstOrThrow();
      expect(sesion.tokenHash).not.toBe(token);
      expect(sesion.tokenHash).toBe(
        createHash('sha256').update(token).digest('hex'),
      );
    });

    it('no entrega el token en el cuerpo de la respuesta', async () => {
      const respuesta = await registrar();
      const token = tokenDe(cookieDeSesion(respuesta.headers));

      expect(JSON.stringify(respuesta.body)).not.toContain(token);
    });
  });

  describe('GET /api/cuenta', () => {
    it('devuelve los nombres del jugador con la sesión del registro', async () => {
      const cookie = cookieDeSesion((await registrar()).headers);

      const respuesta = await consultarCuenta(cookie.split(';')[0]);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({ nombres: 'Valeria' });
    });

    it('responde 401 sin sesión', async () => {
      const respuesta = await consultarCuenta();

      expect(respuesta.status).toBe(401);
      expect(respuesta.body.mensaje).toBe('Inicia sesión para continuar.');
    });

    it('responde 401 con un token inventado', async () => {
      await registrar();

      const respuesta = await consultarCuenta('sesion=token-inventado');

      expect(respuesta.status).toBe(401);
    });

    it('responde 401 si la sesión lleva 15 minutos sin actividad', async () => {
      const cookie = cookieDeSesion((await registrar()).headers);
      await prisma.sesion.updateMany({
        data: { ultimaActividadEn: new Date(Date.now() - 15 * 60 * 1000) },
      });

      const respuesta = await consultarCuenta(cookie.split(';')[0]);

      expect(respuesta.status).toBe(401);
    });

    it('responde 401 si la sesión superó su duración máxima', async () => {
      const cookie = cookieDeSesion((await registrar()).headers);
      await prisma.sesion.updateMany({
        data: { expiraEn: new Date(Date.now() - 1000) },
      });

      const respuesta = await consultarCuenta(cookie.split(';')[0]);

      expect(respuesta.status).toBe(401);
    });
  });
});
