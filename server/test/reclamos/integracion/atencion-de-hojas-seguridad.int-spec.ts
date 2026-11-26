import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

describe('atención de las hojas · seguridad', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('sin sesión responde 401 y un jugador recibe 403', async () => {
    const jugador = await sesionDeJugador(app);

    expect((await api().get('/api/reclamos')).status).toBe(401);
    expect(
      (await api().get('/api/reclamos').set('Cookie', jugador)).status,
    ).toBe(403);
    expect(
      (
        await api()
          .post('/api/reclamos/000001-2026/respuesta')
          .set('Cookie', jugador)
          .send({ texto: 'x' })
      ).status,
    ).toBe(403);
  });

  it('filtros y números fuera de rango responden 400 o 404, nunca 500', async () => {
    const administracion = await sesionDeAdministrador(app);
    const como = (ruta: string) =>
      api().get(ruta).set('Cookie', administracion);

    expect((await como('/api/reclamos?porPagina=30')).status).toBe(400);
    expect((await como('/api/reclamos?pagina=99999999999')).status).toBe(400);
    expect(
      (await como('/api/reclamos?desde=2026-11-10&hasta=2026-11-01')).status,
    ).toBe(400);
    expect((await como('/api/reclamos?estado[]=TODAS')).status).toBe(400);
    expect((await como('/api/reclamos/999999-9999')).status).toBe(404);
    expect((await como('/api/reclamos/-1')).status).toBe(404);
    expect((await como(`/api/reclamos/${'9'.repeat(40)}`)).status).toBe(404);
  });

  it('rechaza campos que no son de la respuesta', async () => {
    const administracion = await sesionDeAdministrador(app);

    const respuesta = await api()
      .post('/api/reclamos/000001-2026/respuesta')
      .set('Cookie', administracion)
      .send({ texto: 'Hola.', estado: 'NUEVA', respondidaPorId: 1 });

    expect(respuesta.status).toBe(400);
  });
});
