import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { BLOQUEO_REPOSITORY } from '../../../src/modulos/canchas/dominio/bloqueo.repository';
import { unBloqueoValido } from '../fabricas/datos-bloqueo';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';

type Metodo = 'get' | 'post' | 'delete';
const RUTAS: [Metodo, string][] = [
  ['get', '/api/bloqueos'],
  ['post', '/api/bloqueos'],
  ['post', '/api/bloqueos/1/liberacion'],
  ['delete', '/api/bloqueos/1'],
];

describe('Bloqueos · seguridad', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('sin sesión responde 401 y un jugador recibe 403 en cada ruta', async () => {
    const jugador = await sesionDeJugador(app);

    for (const [metodo, ruta] of RUTAS) {
      await api()[metodo](ruta).expect(401);
      await api()[metodo](ruta).set('Cookie', jugador).expect(403);
    }
  });

  it('rechaza campos que no son del bloqueo, como quién lo creó o desde cuándo se liberó', async () => {
    const administrador = await sesionDeAdministrador(app);

    const { body } = await api()
      .post('/api/bloqueos')
      .set('Cookie', administrador)
      .send({ ...unBloqueoValido(), creadoPorId: 1, liberadoEn: '2026-01-01' })
      .expect(400);

    expect(body.errores).toEqual({
      creadoPorId: 'Este campo no está permitido.',
      liberadoEn: 'Este campo no está permitido.',
    });
  });

  it('un error interno responde 500 sin detalles', async () => {
    await app.close();
    ({ app, prisma } = await crearAppDePrueba((constructor) =>
      constructor.overrideProvider(BLOQUEO_REPOSITORY).useValue({
        sinTerminar: () => Promise.reject(new Error('detalle interno secreto')),
        terminados: () => Promise.resolve([]),
      }),
    ));
    const administrador = await sesionDeAdministrador(app);

    const respuesta = await api()
      .get('/api/bloqueos')
      .set('Cookie', administrador);

    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(respuesta.body)).not.toContain('secreto');
  });
});
