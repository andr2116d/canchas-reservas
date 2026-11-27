import type { NestExpressApplication } from '@nestjs/platform-express';
import type { TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { AGENDA_DEL_LOCAL } from '../../../src/modulos/reservas/aplicacion/agenda-del-local.port';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  CONTRASENA_TEMPORAL,
  iniciarSesion,
  sesionDeRecepcionista,
} from '../../compartido/soporte/sesiones-de-prueba';
import {
  MANANA,
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../fabricas/local-listo';

describe('Consultar la agenda de turnos: seguridad', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let recepcion: string;
  let jugador: string;

  async function levantar(
    ajustar = (constructor: TestingModuleBuilder) => constructor,
  ) {
    ({ app, prisma } = await crearAppDePrueba(ajustar));
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    recepcion = await sesionDeRecepcionista(app, local.administrador);
    jugador = await unJugadorMas(app, 1);
  }
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const agenda = (consulta: object = {}, cookie = recepcion) =>
    api().get('/api/agenda').query(consulta).set('Cookie', cookie);

  it('sin sesión responde 401', async () => {
    await levantar();

    await api().get('/api/agenda').expect(401);
  });

  it('un jugador recibe 403', async () => {
    await levantar();

    await agenda({}, jugador).expect(403);
  });

  it('con la contraseña temporal sin omitir el cambio recibe 403', async () => {
    await levantar();
    const temporal = cookieDe(
      await iniciarSesion(app, 'rosa.quispe@laprevia.pe', CONTRASENA_TEMPORAL),
    );

    await agenda({}, temporal).expect(403);
  });

  it('no acepta filtros de más', async () => {
    await levantar();

    const { body } = await agenda({ titularId: '1' }).expect(400);

    expect(body.errores).toEqual({
      titularId: 'Este campo no está permitido.',
    });
  });

  it('ids de cancha enormes, negativos o con letras responden 400, nunca 500', async () => {
    await levantar();

    for (const canchaId of ['2147483648', '99999999999', '-1', '1e3', 'x']) {
      const { body } = await agenda({ canchaId }).expect(400);
      expect(body.errores.canchaId).toBe('Elige una cancha de la lista.');
    }
  });

  it('un filtro repetido o con texto hostil responde 400', async () => {
    await levantar();

    await api()
      .get('/api/agenda?estado=CONFIRMADA&estado=EN_JUEGO')
      .set('Cookie', recepcion)
      .expect(400);
    for (const malo of [
      { fecha: `${MANANA()}\u0000` },
      { estado: 'CONFIRMADA\u0007' },
      { canchaId: '1\uD800' },
    ]) {
      await agenda(malo).expect(400);
    }
  });

  it('muestra el nombre y el celular del cliente, pero nunca su documento, correo ni lo cifrado', async () => {
    await levantar();
    await api()
      .post('/api/reservas')
      .set('Cookie', jugador)
      .send(separarALas19(local.canchas[0].id))
      .expect(201);

    const { text } = await agenda({ fecha: MANANA() }).expect(200);

    expect(text).toContain('987654321');
    for (const interno of [
      '40000001',
      'jugador.1@gmail.com',
      'cifrad',
      'Hash',
      'titularId',
      '1998-05-14',
    ])
      expect(text).not.toContain(interno);
  });

  it('una falla al leer responde 500 sin detalles', async () => {
    await levantar((constructor) =>
      constructor.overrideProvider(AGENDA_DEL_LOCAL).useValue({
        canchas: () =>
          Promise.reject(new Error('relation "cancha" does not exist')),
        reservasDelDia: () => Promise.reject(new Error('sin conexión')),
      }),
    );

    const { body, text } = await agenda().expect(500);

    expect(body.mensaje).toBeDefined();
    expect(text).not.toContain('relation');
  });

  it('varias consultas a la vez responden todas sin error', async () => {
    await levantar();

    const respuestas = await Promise.all(
      Array.from({ length: 10 }, () => agenda({ fecha: MANANA() })),
    );

    expect(respuestas.map((r) => r.status)).toEqual(Array(10).fill(200));
  });
});
