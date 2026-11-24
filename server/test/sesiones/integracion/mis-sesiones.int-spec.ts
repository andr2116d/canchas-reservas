import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { unJugadorValido } from '../../usuarios/fabricas/datos-registro-jugador';

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

describe('Mis sesiones y accesos', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    await request(app.getHttpServer())
      .post('/api/jugadores')
      .send(unJugadorValido())
      .expect(201);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const entrar = async (agente: string) =>
    cookieDe(
      await api()
        .post('/api/sesiones')
        .set('User-Agent', agente)
        .send({
          correo: unJugadorValido().correo,
          contrasena: unJugadorValido().contrasena,
        })
        .expect(200),
    );

  it('lista las sesiones abiertas con su dispositivo y marca la actual, sin tokens', async () => {
    const enLaPc = await entrar(CHROME_WINDOWS);
    await entrar(SAFARI_IPHONE);

    const { body } = await api()
      .get('/api/cuenta/sesiones')
      .set('Cookie', enLaPc)
      .expect(200);

    expect(
      body.map((s: { dispositivo: string; actual: boolean }) => [
        s.dispositivo,
        s.actual,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ['Chrome en Windows', true],
        ['Safari en iPhone', false],
      ]),
    );
    expect(Object.keys(body[0]).sort()).toEqual([
      'abiertaEn',
      'actual',
      'dispositivo',
      'id',
      'ultimaActividadEn',
    ]);
  });

  it('cierra las demás sesiones y la actual sigue abierta', async () => {
    const enLaPc = await entrar(CHROME_WINDOWS);
    const enElCelular = await entrar(SAFARI_IPHONE);

    await api()
      .delete('/api/cuenta/sesiones/otras')
      .set('Cookie', enLaPc)
      .expect(204);

    await api().get('/api/cuenta').set('Cookie', enElCelular).expect(401);
    await api().get('/api/cuenta').set('Cookie', enLaPc).expect(200);
  });

  it('muestra sus últimos accesos, el más reciente primero', async () => {
    await entrar(CHROME_WINDOWS);
    const ultima = await entrar(SAFARI_IPHONE);

    const { body } = await api()
      .get('/api/cuenta/accesos')
      .set('Cookie', ultima)
      .expect(200);

    expect(body.length).toBeGreaterThanOrEqual(2);
    expect(body[0].ocurridoEn >= body[1].ocurridoEn).toBe(true);
  });

  it('sin sesión responde 401', async () => {
    await api().get('/api/cuenta/sesiones').expect(401);
    await api().delete('/api/cuenta/sesiones/otras').expect(401);
    await api().get('/api/cuenta/accesos').expect(401);
  });
});
