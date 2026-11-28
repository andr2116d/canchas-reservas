import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  MANANA,
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../../reservas/fabricas/local-listo';

const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

/** Todos los días con la misma apertura y el mismo cierre. */
const unHorario = (abre: string, cierra: string, confirmar?: boolean) => ({
  inicioDeLaNoche: '18:00',
  dias: DIAS.map((dia) => ({ dia, abierto: true, abre, cierra })),
  ...(confirmar !== undefined && { confirmar }),
});

describe('Cambiar el horario con reservas por jugar', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let codigo: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    const jugador = await unJugadorMas(app, 1);
    ({
      body: { codigo },
    } = await api()
      .post('/api/reservas')
      .set('Cookie', jugador)
      .send(separarALas19(local.canchas[0].id))
      .expect(201));
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const guardar = (horario: object) =>
    api().put('/api/horario').set('Cookie', local.administrador).send(horario);
  const cierreVigente = async () =>
    (
      await api()
        .get('/api/horario')
        .set('Cookie', local.administrador)
        .expect(200)
    ).body.vigente.dias[0].cierra as string;

  it('si una reserva queda fuera, no guarda y devuelve la lista con quién avisar', async () => {
    const { body } = await guardar(unHorario('16:00', '18:30')).expect(409);

    expect(body.mensaje).toBe(
      'Hay reservas que quedan fuera del nuevo horario. No se anulan: avisa a cada cliente y confirma para guardar igual.',
    );
    expect(body.datos.reservasFueraDeHorario).toEqual([
      {
        codigo,
        cancha: 'Cancha 1',
        fecha: MANANA(),
        desde: '19:00',
        hasta: '20:00',
        estado: 'PENDIENTE_DE_PAGO',
        titular: 'Valeria León Paredes',
        celular: '987654321',
      },
    ]);
    expect(await cierreVigente()).toBe('22:00');
  });

  it('con la confirmación guarda, la reserva se respeta y queda anotada en la versión', async () => {
    await guardar(unHorario('16:00', '18:30', true)).expect(200);

    expect(await cierreVigente()).toBe('18:30');
    expect(
      await prisma.reserva.findUniqueOrThrow({
        where: { codigo },
        select: { estado: true },
      }),
    ).toEqual({ estado: 'PENDIENTE_DE_PAGO' });
    const version = await prisma.horarioDeAtencion.findFirstOrThrow({
      orderBy: { id: 'desc' },
    });
    expect(version.reservasFueraDeHorario).toEqual([codigo]);
  });

  it('si la reserva sigue dentro, guarda sin preguntar y los turnos nuevos que la pisan no se ofrecen', async () => {
    await guardar(unHorario('16:30', '22:00')).expect(200);

    const { body } = await api()
      .get('/api/disponibilidad')
      .query({ fecha: MANANA() })
      .expect(200);
    const estadoA = (desde: string) =>
      (
        body.tipos[0].turnos as {
          desde: string;
          canchas: { canchaId: number; estado: string }[];
        }[]
      )
        .find((t) => t.desde === desde)
        ?.canchas.find((c) => c.canchaId === local.canchas[0].id)?.estado;
    expect([estadoA('18:30'), estadoA('19:30')]).toEqual([
      'PENDIENTE',
      'PENDIENTE',
    ]);
    expect(estadoA('20:30')).toBe('DISPONIBLE');
  });

  it('no acepta una confirmación que no sea sí o no', async () => {
    const { body } = await guardar({
      ...unHorario('16:00', '18:30'),
      confirmar: 'si',
    }).expect(400);

    expect(body.errores.confirmar).toBe('Indica si se confirma el cambio.');
  });
});
