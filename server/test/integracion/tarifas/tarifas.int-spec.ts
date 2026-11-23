import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../soporte/sesiones-de-prueba';

const FUTBOL_7 = {
  precioDia: '50',
  precioNoche: '100',
  duracionDelTurno: '3',
  ofreceTurnoCorto: false,
};
const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];
const HORARIO = {
  inicioDeLaNoche: '18:00',
  dias: DIAS.map((dia) => ({
    dia,
    abierto: dia !== 'DOMINGO',
    abre: '08:00',
    cierra: '22:00',
  })),
};

describe('Tarifas', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const definir = (tipo: string, datos: object = FUTBOL_7) =>
    api().put(`/api/tarifas/${tipo}`).send(datos);

  it('el administrador define una tarifa y queda una versión con quién la guardó', async () => {
    const { body } = await definir('FUTBOL_7')
      .set('Cookie', administrador)
      .expect(200);

    expect(body).toMatchObject({
      cambio: true,
      vigente: {
        precioDia: '50.00',
        precioNoche: '100.00',
        duracionDelTurnoHoras: 3,
        guardadaPor: 'Valeria León Paredes',
      },
    });
    const [fila] = await prisma.tarifaDeCancha.findMany();
    expect(fila.precioNoche.toString()).toBe('100');
  });

  it('guardar los mismos valores no crea otra versión, ni con guardados simultáneos', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () =>
        definir('FUTBOL_7').set('Cookie', administrador),
      ),
    );
    const otra = await definir('FUTBOL_7', { ...FUTBOL_7, precioDia: '50.00' })
      .set('Cookie', administrador)
      .expect(200);

    expect(otra.body.cambio).toBe(false);
    expect(await prisma.tarifaDeCancha.count()).toBe(1);
  });

  it('cada cambio agrega una versión y la consulta trae la vigente con su historial', async () => {
    await definir('FUTBOL_7').set('Cookie', administrador).expect(200);
    await definir('FUTBOL_7', { ...FUTBOL_7, precioNoche: '120' })
      .set('Cookie', administrador)
      .expect(200);

    const { body } = await api()
      .get('/api/tarifas')
      .set('Cookie', administrador)
      .expect(200);

    const futbol7 = body.tarifas.find(
      (t: { tipo: string }) => t.tipo === 'FUTBOL_7',
    );
    expect(futbol7.vigente.precioNoche).toBe('120.00');
    expect(
      futbol7.historial.map((v: { precioNoche: string }) => v.precioNoche),
    ).toEqual(['120.00', '100.00']);
    expect(
      body.tarifas.find((t: { tipo: string }) => t.tipo === 'FUTBOL_5').vigente,
    ).toBeUndefined();
  });

  it('rechaza montos en cero, negativos o que no son números, con el mensaje de cada campo', async () => {
    const respuesta = await definir('FUTBOL_5', {
      precioDia: '0',
      precioNoche: 'abc',
      duracionDelTurno: '-1',
      ofreceTurnoCorto: false,
    })
      .set('Cookie', administrador)
      .expect(400);

    expect(respuesta.body.errores).toEqual({
      precioDia: 'El monto debe ser mayor que cero.',
      precioNoche: 'Ingresa el monto en soles, por ejemplo 50 o 49.90.',
      duracionDelTurno: 'Elige un turno de 1 a 12 horas enteras.',
    });
    expect(await prisma.tarifaDeCancha.count()).toBe(0);
  });

  it('responde 404 a un tipo de cancha que no existe y 400 a campos de más', async () => {
    await definir('FUTBOL_11').set('Cookie', administrador).expect(404);
    await definir('FUTBOL_5', { ...FUTBOL_7, cancha: 'La Popular' })
      .set('Cookie', administrador)
      .expect(400);
  });

  it('solo el administrador define y consulta las tarifas', async () => {
    const jugador = await sesionDeJugador(app);

    await definir('FUTBOL_7').set('Cookie', jugador).expect(403);
    await api().get('/api/tarifas').set('Cookie', jugador).expect(403);
    await definir('FUTBOL_7').expect(401);
  });

  const turnosDel = (tipo: string, dia: string, cookie: string) =>
    api().get('/api/tarifas/turnos').query({ tipo, dia }).set('Cookie', cookie);

  it('cualquier sesión ve los turnos del día con su precio y desglose', async () => {
    await definir('FUTBOL_7').set('Cookie', administrador).expect(200);
    await api()
      .put('/api/horario')
      .send(HORARIO)
      .set('Cookie', administrador)
      .expect(200);
    const jugador = await sesionDeJugador(app);

    const { body } = await turnosDel('FUTBOL_7', 'LUNES', jugador).expect(200);

    expect(body).toMatchObject({
      estado: 'ABIERTO',
      duracionDelTurnoHoras: 3,
      inicioDeLaNoche: '18:00',
    });
    expect(body.turnos).toHaveLength(4);
    expect(body.turnos[3]).toEqual({
      desde: '17:00',
      hasta: '20:00',
      corto: false,
      total: '83.33',
      tramos: [
        { franja: 'DIA', desde: '17:00', hasta: '18:00', monto: '16.67' },
        { franja: 'NOCHE', desde: '18:00', hasta: '20:00', monto: '66.66' },
      ],
    });
    expect(body.sinTurno).toEqual({ desde: '20:00', hasta: '22:00' });
  });

  it('con turno corto ofrece el rato final cobrado en proporción', async () => {
    await definir('FUTBOL_7', { ...FUTBOL_7, ofreceTurnoCorto: true })
      .set('Cookie', administrador)
      .expect(200);
    await api()
      .put('/api/horario')
      .send(HORARIO)
      .set('Cookie', administrador)
      .expect(200);

    const { body } = await turnosDel('FUTBOL_7', 'LUNES', administrador).expect(
      200,
    );

    expect(body.turnos.at(-1)).toMatchObject({
      desde: '20:00',
      hasta: '22:00',
      corto: true,
      total: '66.67',
    });
    expect(body.sinTurno).toBeUndefined();
  });

  it('avisa si no hay tarifa, si no hay horario o si el día está cerrado', async () => {
    const sinTarifa = await turnosDel(
      'FUTBOL_5',
      'LUNES',
      administrador,
    ).expect(409);
    expect(sinTarifa.body.mensaje).toBe('Todavía no hay tarifa para fútbol 5.');

    await definir('FUTBOL_5', FUTBOL_7)
      .set('Cookie', administrador)
      .expect(200);
    const sinHorario = await turnosDel(
      'FUTBOL_5',
      'LUNES',
      administrador,
    ).expect(200);
    expect(sinHorario.body).toEqual({ estado: 'SIN_HORARIO' });

    await api()
      .put('/api/horario')
      .send(HORARIO)
      .set('Cookie', administrador)
      .expect(200);
    const cerrado = await turnosDel(
      'FUTBOL_5',
      'DOMINGO',
      administrador,
    ).expect(200);
    expect(cerrado.body).toEqual({ estado: 'CERRADO' });
    await turnosDel('FUTBOL_5', 'FERIADO', administrador).expect(400);
  });

  it('la base también rechaza una tarifa en cero', async () => {
    const admin = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'ADMINISTRADOR' },
    });

    await expect(
      prisma.tarifaDeCancha.create({
        data: {
          tipoDeCancha: 'FUTBOL_5',
          precioDia: 0,
          precioNoche: 40,
          duracionDelTurnoHoras: 1,
          guardadaPorId: admin.id,
        },
      }),
    ).rejects.toThrow();
  });
});
