import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../fabricas/local-listo';

describe('Reservar un turno: pedidos a la vez', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let cancha: number;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    cancha = (await prepararElLocal(app)).canchas[0].id;
  });
  afterEach(() => app.close());

  const separar = (cookie: string, cuerpo: object) =>
    request(app.getHttpServer())
      .post('/api/reservas')
      .set('Cookie', cookie)
      .send(cuerpo);

  it('de 50 pedidos simultáneos al mismo turno se crea exactamente 1 y se rechazan 49', async () => {
    const jugadores = await Promise.all(
      [1, 2, 3, 4, 5].map((n) => unJugadorMas(app, n)),
    );

    const respuestas = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        separar(jugadores[i % 5], separarALas19(cancha)),
      ),
    );

    const estados = respuestas.map((r) => r.status);
    expect(estados.filter((e) => e === 201)).toHaveLength(1);
    expect(estados.filter((e) => e === 409)).toHaveLength(49);
    expect(await prisma.reserva.count()).toBe(1);
  });

  it('pedidos a la vez de una misma persona no superan las 2 pendientes de pago', async () => {
    const jugador = await unJugadorMas(app, 1);

    const respuestas = await Promise.all(
      ['17:00', '18:00', '19:00', '20:00', '21:00'].map((desde) =>
        separar(jugador, separarALas19(cancha, { desde, ...montosDe(desde) })),
      ),
    );

    expect(respuestas.filter((r) => r.status === 201)).toHaveLength(2);
    expect(respuestas.every((r) => [201, 409].includes(r.status))).toBe(true);
    expect(await prisma.reserva.count()).toBe(2);
  });
});

/** De día (antes de las 18:00) el turno vale S/ 60; de noche, S/ 80. */
const montosDe = (desde: string) =>
  desde < '18:00'
    ? { precio: '60.00', adelanto: '30.00' }
    : { precio: '80.00', adelanto: '40.00' };
