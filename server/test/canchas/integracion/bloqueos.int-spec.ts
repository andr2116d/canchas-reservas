import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { RESERVAS_DE_CANCHA } from '../../../src/modulos/canchas/aplicacion/reservas-de-cancha.port';
import { ReservasDeCanchaDePrueba } from '../dobles/reservas-de-cancha-de-prueba';
import { unBloqueoValido } from '../fabricas/datos-bloqueo';
import { unaCanchaValida } from '../fabricas/datos-cancha';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../../compartido/soporte/sesiones-de-prueba';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
/** Fecha de Lima dentro de tantos días, para que el bloqueo siempre sea futuro. */
const dentroDe = (dias: number) =>
  fechaEnLima(new Date(Date.now() + dias * MS_POR_DIA));
const enTresDias = (cambios = {}) =>
  unBloqueoValido({
    desdeFecha: dentroDe(3),
    hastaFecha: dentroDe(3),
    ...cambios,
  });

describe('Bloqueos por mantenimiento', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;
  let reservas: ReservasDeCanchaDePrueba;

  beforeEach(async () => {
    reservas = new ReservasDeCanchaDePrueba();
    ({ app, prisma } = await crearAppDePrueba((modulo) =>
      modulo.overrideProvider(RESERVAS_DE_CANCHA).useValue(reservas),
    ));
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
    await api()
      .post('/api/canchas')
      .set('Cookie', administrador)
      .send({
        canchas: ['Cancha 1', 'Cancha 2'].map((nombre) =>
          unaCanchaValida({ nombre }),
        ),
      })
      .expect(201);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const bloquear = (datos: object) =>
    api().post('/api/bloqueos').set('Cookie', administrador).send(datos);
  const listar = async () =>
    (await api().get('/api/bloqueos').set('Cookie', administrador).expect(200))
      .body as {
      sinTerminar: {
        id: number;
        cancha: string;
        etapa: string;
        liberado: boolean;
      }[];
      terminados: { id: number; liberado: boolean }[];
    };
  const cambios = async () =>
    (
      (
        await api()
          .get('/api/canchas/cambios')
          .set('Cookie', administrador)
          .expect(200)
      ).body as { accion: string }[]
    ).map((c) => c.accion);

  it('bloquea varias canchas en el rango de Lima y queda en la auditoría', async () => {
    const { body } = await bloquear(enTresDias({ canchaIds: [1, 2] })).expect(
      201,
    );

    expect(body.bloqueos).toHaveLength(2);
    expect(body.bloqueos[0]).toMatchObject({
      cancha: 'Cancha 1',
      tipo: 'PROGRAMADO',
      etapa: 'PROXIMO',
    });
    expect(new Date(body.bloqueos[0].inicio).getUTCHours()).toBe(13);
    expect((await listar()).sinTerminar).toHaveLength(2);
    expect((await cambios()).filter((a) => a === 'BLOQUEO')).toHaveLength(2);
  });

  it('con repetición semanal crea un bloqueo por semana', async () => {
    const { body } = await bloquear(
      enTresDias({
        repeticion: { frecuencia: 'SEMANAL', hasta: dentroDe(3 + 21) },
      }),
    ).expect(201);

    expect(body.bloqueos).toHaveLength(4);
  });

  it('si falta un dato o el inicio ya pasó, no guarda y dice qué corregir', async () => {
    const { body } = await bloquear(
      unBloqueoValido({
        canchaIds: [],
        motivo: '',
        desdeFecha: dentroDe(-1),
        hastaFecha: dentroDe(1),
      }),
    ).expect(400);

    expect(body.errores).toEqual({
      canchaIds: 'Elige al menos una cancha.',
      motivo: 'Escribe el motivo del bloqueo.',
      desde:
        'El inicio ya pasó. Para algo que ocurre ahora, usa «Desde ahora».',
    });
    expect(await prisma.bloqueoDeCancha.count()).toBe(0);
  });

  it('no pisa otro bloqueo de la misma cancha, aunque lleguen al mismo tiempo', async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 4 }, () => bloquear(enTresDias())),
    );

    expect(respuestas.map((r) => r.status).sort()).toEqual([
      201, 409, 409, 409,
    ]);
    const { body } = await bloquear(
      enTresDias({ desdeHora: '13:00', hastaHora: '15:00' }),
    ).expect(409);
    expect(body.mensaje).toBe('Ya hay un bloqueo en ese rango.');
    expect(await prisma.bloqueoDeCancha.count()).toBe(1);
  });

  it('uno programado que choca con reservas no se guarda y las lista; uno de emergencia sí', async () => {
    const inicioDeLaReserva = new Date(`${dentroDe(3)}T10:00:00.000-05:00`);
    reservas.reservar(1, inicioDeLaReserva.toISOString(), 'M. Quispe');

    const programado = await bloquear(enTresDias()).expect(409);
    expect(programado.body.datos.reservas).toEqual([
      expect.objectContaining({ cancha: 'Cancha 1', titular: 'M. Quispe' }),
    ]);

    const emergencia = await bloquear(
      enTresDias({ tipo: 'EMERGENCIA' }),
    ).expect(201);
    expect(emergencia.body.reservasAfectadas).toHaveLength(1);
  });

  it('libera desde ahora uno en curso y la cancha vuelve a estar disponible', async () => {
    const { body } = await bloquear(
      unBloqueoValido({
        tipo: 'EMERGENCIA',
        desdeAhora: true,
        hastaFecha: dentroDe(1),
        hastaHora: '23:00',
      }),
    ).expect(201);
    const id = body.bloqueos[0].id as number;
    expect((await listar()).sinTerminar[0].etapa).toBe('EN_CURSO');

    await api()
      .post(`/api/bloqueos/${id}/liberacion`)
      .set('Cookie', administrador)
      .expect(204);

    const lista = await listar();
    expect(lista.sinTerminar).toEqual([]);
    expect(lista.terminados[0]).toMatchObject({ id, liberado: true });
    expect(await cambios()).toContain('LIBERACION_DE_BLOQUEO');
    const otraVez = await api()
      .delete(`/api/bloqueos/${id}`)
      .set('Cookie', administrador)
      .expect(409);
    expect(otraVez.body.mensaje).toBe('El bloqueo ya terminó.');
  });

  it('quita entero uno que no empezó y queda en la auditoría', async () => {
    const { body } = await bloquear(enTresDias()).expect(201);

    await api()
      .delete(`/api/bloqueos/${body.bloqueos[0].id}`)
      .set('Cookie', administrador)
      .expect(204);

    expect(await prisma.bloqueoDeCancha.count()).toBe(0);
    expect(await cambios()).toContain('RETIRO_DE_BLOQUEO');
  });

  it('responde que no existe a un id que no es de ningún bloqueo', async () => {
    for (const id of ['99', 'abc']) {
      const { body } = await api()
        .delete(`/api/bloqueos/${id}`)
        .set('Cookie', administrador)
        .expect(404);
      expect(body.mensaje).toBe('No encontramos el bloqueo.');
    }
  });
});
