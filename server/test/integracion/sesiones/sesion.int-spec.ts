import { createHash } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unJugadorValido } from '../../fabricas/datos-registro-jugador';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';

/** Extrae el valor de la cookie `sesion` de una respuesta. */
function cookieDeSesion(cabeceras: Record<string, unknown>): string {
  const cookies = (cabeceras['set-cookie'] as string[] | undefined) ?? [];
  const cookie = cookies.find((valor) => valor.startsWith('sesion='));
  if (!cookie) throw new Error('La respuesta no trae la cookie de sesión');
  return cookie;
}

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
      expect(respuesta.body).toEqual({ nombres: 'Valeria' });
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

    it('responde 401 si la sesión lleva 30 minutos sin actividad', async () => {
      const cookie = cookieDeSesion((await registrar()).headers);
      await prisma.sesion.updateMany({
        data: { ultimaActividadEn: new Date(Date.now() - 31 * 60 * 1000) },
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
