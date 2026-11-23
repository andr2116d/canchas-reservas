import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { HASHEADOR_CONTRASENA } from '../../../src/modulos/usuarios/aplicacion/hasheador-contrasena.port';
import { unJugadorValido } from '../../fabricas/datos-registro-jugador';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';

describe('POST /api/jugadores · seguridad', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  // Una app nueva por prueba: el límite de intentos se cuenta por instancia.
  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const registrar = (cuerpo: object) =>
    request(app.getHttpServer()).post('/api/jugadores').send(cuerpo);

  it('responde 429 después de 10 registros desde la misma IP en una hora', async () => {
    for (let intento = 1; intento <= 10; intento++) {
      await registrar(unJugadorValido({ contrasena: 'x' }));
    }

    const respuesta = await registrar(unJugadorValido());

    expect(respuesta.status).toBe(429);
    expect(respuesta.body.mensaje).toBe(
      'Hubo demasiados intentos. Espera un momento y vuelve a intentarlo.',
    );
  });

  it('rechaza un envío desde otro sitio (CSRF) con 403', async () => {
    const respuesta = await registrar(unJugadorValido()).set(
      'Sec-Fetch-Site',
      'cross-site',
    );

    expect(respuesta.status).toBe(403);
    expect(await prisma.usuario.count()).toBe(0);
  });

  it('envía cabeceras de seguridad y oculta la tecnología del server', async () => {
    const respuesta = await registrar(unJugadorValido());

    expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
    expect(respuesta.headers['x-powered-by']).toBeUndefined();
  });

  it('responde 500 sin detalles internos si algo falla', async () => {
    await app.close();
    ({ app, prisma } = await crearAppDePrueba((constructor) =>
      constructor.overrideProvider(HASHEADOR_CONTRASENA).useValue({
        hashear: () => Promise.reject(new Error('detalle interno secreto')),
      }),
    ));

    const respuesta = await registrar(unJugadorValido());

    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(respuesta.body)).not.toContain('secreto');
  });
});
