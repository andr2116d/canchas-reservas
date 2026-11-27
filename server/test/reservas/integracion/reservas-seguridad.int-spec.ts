import type { NestExpressApplication } from '@nestjs/platform-express';
import type { TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { RESERVA_REPOSITORY } from '../../../src/modulos/reservas/dominio/reserva.repository';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  MANANA,
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../fabricas/local-listo';

describe('Reservar un turno: seguridad', () => {
  let app: NestExpressApplication;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let cancha: number;
  let jugador: string;

  async function levantar(
    ajustar = (constructor: TestingModuleBuilder) => constructor,
  ) {
    const creada = await crearAppDePrueba(ajustar);
    app = creada.app;
    await limpiarTablas(creada.prisma);
    local = await prepararElLocal(app);
    cancha = local.canchas[0].id;
    jugador = await unJugadorMas(app, 1);
  }
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const separar = (cuerpo: object, cookie = jugador) =>
    api().post('/api/reservas').set('Cookie', cookie).send(cuerpo);

  it('sin sesión responde 401 en cada ruta', async () => {
    await levantar();

    await api().post('/api/reservas').send(separarALas19(cancha)).expect(401);
    await api().get('/api/reservas/resumen').expect(401);
    await api().get('/api/reservas/ABCDEF').expect(401);
  });

  it('solo un jugador separa turnos: administración recibe 403', async () => {
    await levantar();

    await separar(separarALas19(cancha), local.administrador).expect(403);
  });

  it('la reserva de otra persona, o un código raro, responde como si no existiera', async () => {
    await levantar();
    const { body } = await separar(separarALas19(cancha)).expect(201);
    const otro = await unJugadorMas(app, 2);

    for (const codigo of [body.codigo, 'abc%00', 'A'.repeat(500)]) {
      await api()
        .get(`/api/reservas/${codigo}`)
        .set('Cookie', otro)
        .expect(404);
    }
  });

  it('el titular sale de la sesión, nunca del cuerpo, y no se aceptan campos de más', async () => {
    await levantar();

    const { body } = await separar(
      separarALas19(cancha, { titularId: 1, estado: 'CONFIRMADA' }),
    ).expect(400);

    expect(body.errores).toEqual({
      titularId: 'Este campo no está permitido.',
      estado: 'Este campo no está permitido.',
    });
  });

  it('ids enormes, negativos o con letras responden 400 por campo, nunca 500', async () => {
    await levantar();

    const malos = [
      { canchaId: 2_147_483_648 },
      { canchaId: -1 },
      { canchaId: '1' },
      { adicionales: [9_999_999_999] },
      { adicionales: ['x'] },
    ];
    for (const malo of malos) {
      await separar(separarALas19(cancha, malo)).expect(400);
    }
    await api()
      .get('/api/reservas/resumen')
      .query({ canchaId: '99999999999', fecha: MANANA(), desde: '19:00' })
      .set('Cookie', jugador)
      .expect(400);
  });

  it('texto hostil en la hora, la fecha o un monto responde 400', async () => {
    await levantar();

    for (const malo of [
      { desde: '19:\u000000' },
      { fecha: `${MANANA()}\u0007` },
      { precio: '80\uD800' },
    ]) {
      await separar(separarALas19(cancha, malo)).expect(400);
    }
  });

  it('la respuesta no expone al titular ni datos internos', async () => {
    await levantar();
    const { body } = await separar(separarALas19(cancha)).expect(201);

    const { text } = await api()
      .get(`/api/reservas/${body.codigo}`)
      .set('Cookie', jugador)
      .expect(200);

    for (const interno of [
      'titularId',
      'creadaPorId',
      'Valeria',
      'cifrad',
      'reglaDeCancelacionId',
    ])
      expect(text).not.toContain(interno);
  });

  it('una falla al guardar responde 500 sin detalles', async () => {
    await levantar((constructor) =>
      constructor.overrideProvider(RESERVA_REPOSITORY).useValue({
        crear: () =>
          Promise.reject(new Error('relation "reserva" does not exist')),
        delTitular: () => Promise.reject(new Error('sin conexión')),
      }),
    );

    const { body, text } = await separar(separarALas19(cancha)).expect(500);

    expect(body.mensaje).toBeDefined();
    expect(text).not.toContain('relation');
  });
});
