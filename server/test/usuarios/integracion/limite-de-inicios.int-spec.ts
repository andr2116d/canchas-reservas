import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unJugadorValido } from '../fabricas/datos-registro-jugador';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';

const CONTACTO = { correo: 'jugador@externo.test', contrasena: 'temporal2026' };

describe('Límites de intentos al iniciar sesión', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  // Una app nueva por prueba: los contadores de intentos viven en memoria.
  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  function api() {
    return request(app.getHttpServer());
  }

  function iniciar(correo = CONTACTO.correo, contrasena = CONTACTO.contrasena) {
    return api().post('/api/sesiones').send({ correo, contrasena });
  }

  async function crearJugador() {
    await api()
      .post('/api/jugadores')
      .send(unJugadorValido(CONTACTO))
      .expect(201);
  }

  it('limita intentos por correo normalizado incluso desde IP distintas', async () => {
    for (let intento = 0; intento < 8; intento++) {
      await iniciar()
        .set('X-Forwarded-For', '192.0.2.' + (intento + 1))
        .expect(401);
    }

    const bloqueo = await iniciar(' JUGADOR@EXTERNO.TEST ')
      .set('X-Forwarded-For', '192.0.2.23')
      .expect(429);

    expect(Number(bloqueo.headers['retry-after'])).toBeGreaterThan(0);
    expect(bloqueo.headers['set-cookie']).toBeUndefined();
  });

  it('los ingresos correctos no cuentan para el límite por correo', async () => {
    await crearJugador();

    for (let ingreso = 0; ingreso < 10; ingreso++) {
      await iniciar()
        .set('X-Forwarded-For', '198.51.100.' + (ingreso + 1))
        .expect(200);
    }
  });

  it('un ingreso correcto reinicia el contador de intentos fallidos', async () => {
    await crearJugador();
    const fallar = (ip: number) =>
      iniciar(CONTACTO.correo, 'incorrecta123')
        .set('X-Forwarded-For', '203.0.113.' + ip)
        .expect(401);
    for (let intento = 1; intento <= 7; intento++) await fallar(intento);

    await iniciar().set('X-Forwarded-For', '203.0.113.50').expect(200);

    for (let intento = 8; intento <= 14; intento++) await fallar(intento);
    await iniciar().set('X-Forwarded-For', '203.0.113.60').expect(200);
  });

  it('limita intentos por IP aunque cambie el correo', async () => {
    for (let intento = 0; intento < 20; intento++) {
      await iniciar('prueba' + intento + '@externo.test').expect(401);
    }

    await iniciar('ultimo@externo.test').expect(429);
  });
});
