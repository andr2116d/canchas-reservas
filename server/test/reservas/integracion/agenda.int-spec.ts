import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { sesionDeRecepcionista } from '../../compartido/soporte/sesiones-de-prueba';
import {
  MANANA,
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../fabricas/local-listo';

describe('Consultar la agenda de turnos', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let recepcion: string;
  let jugador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    recepcion = await sesionDeRecepcionista(app, local.administrador);
    jugador = await unJugadorMas(app, 1);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const separar = (canchaId: number, desde = '19:00') =>
    api()
      .post('/api/reservas')
      .set('Cookie', jugador)
      .send(
        separarALas19(canchaId, {
          desde,
          precio: desde < '18:00' ? '60.00' : '80.00',
          adelanto: desde < '18:00' ? '30.00' : '40.00',
        }),
      )
      .expect(201);
  const agenda = (consulta: object = {}, cookie = recepcion) =>
    api().get('/api/agenda').query(consulta).set('Cookie', cookie);

  it('muestra cada turno con su horario, cancha, cliente, celular, estado, lo pagado y el saldo', async () => {
    const { body: reserva } = await separar(local.canchas[0].id);

    const { body } = await agenda({ fecha: MANANA() }).expect(200);

    expect(body.fecha).toBe(MANANA());
    expect(body.turnos).toEqual([
      expect.objectContaining({
        codigo: reserva.codigo,
        desde: '19:00',
        hasta: '20:00',
        cancha: {
          id: local.canchas[0].id,
          nombre: 'Cancha 1',
          tipo: 'FUTBOL_5',
        },
        cliente: { nombre: 'Valeria León Paredes', celular: '987654321' },
        estado: 'PENDIENTE_DE_PAGO',
        precio: '80.00',
        adelanto: '40.00',
        pagado: '0.00',
        saldo: '80.00',
        pagada: false,
        acciones: ['CANCELAR', 'REUBICAR'],
      }),
    ]);
  });

  it('administración también la consulta', async () => {
    await separar(local.canchas[0].id);

    const { body } = await agenda(
      { fecha: MANANA() },
      local.administrador,
    ).expect(200);

    expect(body.turnos).toHaveLength(1);
  });

  it('ordena por hora de inicio y filtra por cancha y por estado', async () => {
    const [uno, dos] = local.canchas.map((c) => c.id);
    await separar(dos, '19:00');
    await separar(uno, '17:00');
    await prisma.reserva.updateMany({
      where: { canchaId: dos },
      data: { estado: 'CONFIRMADA', venceEn: null },
    });

    const todos = await agenda({ fecha: MANANA() }).expect(200);
    const enLaDos = await agenda({
      fecha: MANANA(),
      canchaId: String(dos),
    }).expect(200);
    const confirmadas = await agenda({
      fecha: MANANA(),
      estado: 'CONFIRMADA',
    }).expect(200);

    expect(todos.body.turnos.map((t: { desde: string }) => t.desde)).toEqual([
      '17:00',
      '19:00',
    ]);
    expect(enLaDos.body.turnos).toHaveLength(1);
    expect(confirmadas.body.turnos[0]).toMatchObject({
      cancha: { id: dos },
      acciones: ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR'],
    });
    expect(confirmadas.body.conteos).toMatchObject({
      PENDIENTE_DE_PAGO: 1,
      CONFIRMADA: 1,
    });
  });

  it('una pendiente vencida se ve expirada, sin acciones', async () => {
    const { body: reserva } = await separar(local.canchas[0].id);
    await prisma.reserva.update({
      where: { codigo: reserva.codigo },
      data: { venceEn: new Date(Date.now() - 1000) },
    });

    const { body } = await agenda({ fecha: MANANA() }).expect(200);

    expect(body.turnos[0]).toMatchObject({ estado: 'EXPIRADA', acciones: [] });
  });

  it('sin fecha muestra hoy y lista las canchas para el filtro', async () => {
    const { body } = await agenda().expect(200);

    expect(body.fecha).toBe(body.hoy);
    expect(body.turnos).toEqual([]);
    expect(body.canchas.map((c: { nombre: string }) => c.nombre)).toEqual([
      'Cancha 1',
      'Cancha 2',
    ]);
  });

  it('dice qué filtro no sirve', async () => {
    const { body } = await agenda({
      fecha: '2026-02-30',
      canchaId: '999',
      estado: 'CANCELADA',
    }).expect(400);

    expect(body.errores).toEqual({
      fecha: 'Ingresa una fecha válida.',
      canchaId: 'Elige una cancha de la lista.',
      estado: 'Elige un estado de la lista.',
    });
  });
});
