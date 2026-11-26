import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  fechaEnLima,
  sumarAFecha,
} from '../../../src/compartido/dominio/momento-en-lima';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaCanchaValida } from '../../canchas/fabricas/datos-cancha';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';
import { guardarReserva } from '../../reservas/fabricas/reserva-de-prueba';

const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];
const MANANA = () => sumarAFecha(fechaEnLima(new Date()), { dias: 1 });

interface Turno {
  desde: string;
  precio: string;
  adelanto: string | null;
  canchas: { canchaId: number; estado: string }[];
}

describe('Disponibilidad pública', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;
  let canchas: { id: number; nombre: string }[];

  const api = () => request(app.getHttpServer());
  const comoAdministrador = (
    metodo: 'post' | 'put',
    ruta: string,
    cuerpo: object,
  ) =>
    api()
      [metodo](ruta)
      .set('Cookie', administrador)
      .send(cuerpo)
      .expect((r) => {
        if (r.status >= 300) throw new Error(`${ruta} respondió ${r.status}`);
      });

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
    await sesionDeJugador(app);
    await comoAdministrador('put', '/api/horario', {
      inicioDeLaNoche: '18:00',
      dias: DIAS.map((dia) => ({
        dia,
        abierto: true,
        abre: '16:00',
        cierra: '22:00',
      })),
    });
    await comoAdministrador('put', '/api/tarifas/FUTBOL_5', {
      precioDia: '60',
      precioNoche: '80',
      duracionDelTurno: '1',
      ofreceTurnoCorto: false,
    });
    await comoAdministrador('put', '/api/adelanto', { porcentaje: '50' });
    const { body } = await comoAdministrador('post', '/api/canchas', {
      canchas: [
        unaCanchaValida({ nombre: 'Cancha 1' }),
        unaCanchaValida({ nombre: 'Cancha 2' }),
        unaCanchaValida({ nombre: 'Cancha 3', tipo: 'FUTBOL_7' }),
      ],
    });
    canchas = body as { id: number; nombre: string }[];
  });
  afterEach(() => app.close());

  const consultar = (fecha = MANANA()) =>
    api().get('/api/disponibilidad').query({ fecha });
  const turnosDeFutbol5 = (cuerpo: {
    tipos: { tipo: string; turnos?: Turno[] }[];
  }) => cuerpo.tipos.find((t) => t.tipo === 'FUTBOL_5')?.turnos ?? [];

  it('cualquiera, sin iniciar sesión, ve los turnos con precio, adelanto y estado', async () => {
    const { body } = await consultar().expect(200);

    expect(body).toMatchObject({
      fecha: MANANA(),
      local: 'ABIERTO',
      adelanto: 50,
    });
    expect(turnosDeFutbol5(body)[2]).toMatchObject({
      desde: '18:00',
      precio: '80.00',
      adelanto: '40.00',
      canchas: [
        { canchaId: canchas[0].id, estado: 'DISPONIBLE' },
        { canchaId: canchas[1].id, estado: 'DISPONIBLE' },
      ],
    });
    expect(
      body.tipos.find((t: { tipo: string }) => t.tipo === 'FUTBOL_7'),
    ).toMatchObject({
      estado: 'SIN_TARIFA',
    });
  });

  it('muestra las reservas y el mantenimiento sin decir de quién son ni por qué', async () => {
    await guardarReserva(prisma, {
      canchaId: canchas[0].id,
      inicio: `${MANANA()}T16:00:00-05:00`,
      estado: 'PENDIENTE_DE_VALIDACION',
    });
    await guardarReserva(prisma, {
      canchaId: canchas[0].id,
      inicio: `${MANANA()}T17:00:00-05:00`,
    });
    await comoAdministrador('post', '/api/bloqueos', {
      canchaIds: [canchas[1].id],
      tipo: 'PROGRAMADO',
      desdeAhora: false,
      desdeFecha: MANANA(),
      desdeHora: '19:30',
      hastaFecha: MANANA(),
      hastaHora: '20:30',
      motivo: 'Cambio de redes del arco',
    });

    const { body, text } = await consultar().expect(200);

    const estados = turnosDeFutbol5(body).map((t) =>
      t.canchas.map((c) => c.estado),
    );
    expect(estados.slice(0, 5)).toEqual([
      ['PENDIENTE', 'DISPONIBLE'],
      ['OCUPADO', 'DISPONIBLE'],
      ['DISPONIBLE', 'DISPONIBLE'],
      ['DISPONIBLE', 'MANTENIMIENTO'],
      ['DISPONIBLE', 'MANTENIMIENTO'],
    ]);
    expect(text).not.toContain('Cambio de redes');
    expect(text).not.toContain('Valeria');
  });

  it('no muestra las canchas desactivadas', async () => {
    await comoAdministrador(
      'post',
      `/api/canchas/${canchas[1].id}/desactivacion`,
      {},
    );

    const { body } = await consultar().expect(200);

    const futbol5 = body.tipos.find(
      (t: { tipo: string }) => t.tipo === 'FUTBOL_5',
    );
    expect(futbol5.canchas.map((c: { nombre: string }) => c.nombre)).toEqual([
      'Cancha 1',
    ]);
  });

  it('un bloqueo liberado deja de contar desde que se liberó', async () => {
    const { body: bloqueo } = await comoAdministrador('post', '/api/bloqueos', {
      canchaIds: [canchas[0].id],
      tipo: 'EMERGENCIA',
      desdeAhora: true,
      hastaFecha: MANANA(),
      hastaHora: '22:00',
      motivo: 'Fuga de agua',
    });
    await comoAdministrador(
      'post',
      `/api/bloqueos/${bloqueo.bloqueos[0].id}/liberacion`,
      {},
    );

    const { body } = await consultar().expect(200);

    expect(turnosDeFutbol5(body)[0].canchas[0].estado).toBe('DISPONIBLE');
  });

  it('rechaza fechas pasadas, de más de 30 días o mal escritas', async () => {
    const hoy = fechaEnLima(new Date());

    const ayer = await consultar(sumarAFecha(hoy, { dias: -1 })).expect(400);
    const lejos = await consultar(sumarAFecha(hoy, { dias: 31 })).expect(400);
    await consultar('2026-13-01').expect(400);
    await api().get('/api/disponibilidad').query('fecha=a&fecha=b').expect(400);
    await consultar('x'.repeat(5000)).expect(400);

    expect(ayer.body.errores).toEqual({ fecha: 'Elige una fecha desde hoy.' });
    expect(lejos.body.errores).toEqual({
      fecha: 'Solo se pueden consultar los próximos 30 días.',
    });
    await consultar(sumarAFecha(hoy, { dias: 30 })).expect(200);
  });

  it('sin fecha consulta hoy', async () => {
    const { body } = await api().get('/api/disponibilidad').expect(200);

    expect(body.fecha).toBe(fechaEnLima(new Date()));
  });
});
