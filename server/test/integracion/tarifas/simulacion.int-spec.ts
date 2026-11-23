import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../soporte/sesiones-de-prueba';

const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];
const FUTBOL_7 = {
  tipo: 'FUTBOL_7',
  precioDia: '50',
  precioNoche: '100',
  duracionDelTurno: '3',
  ofreceTurnoCorto: false,
};

function unaSimulacion() {
  return {
    horario: {
      inicioDeLaNoche: '18:00',
      dias: DIAS.map((dia) => ({
        dia,
        abierto: dia !== 'DOMINGO',
        abre: '08:00',
        cierra: '22:00',
      })),
    },
    tarifas: [FUTBOL_7],
  };
}

describe('Simulación de turnos', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administrador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administrador = await sesionDeAdministrador(app);
  });
  afterEach(() => app.close());

  const simular = (datos: object) =>
    request(app.getHttpServer()).post('/api/tarifas/simulacion').send(datos);

  it('calcula los turnos de la semana con lo que se está editando y no guarda nada', async () => {
    const { body } = await simular(unaSimulacion())
      .set('Cookie', administrador)
      .expect(200);

    expect(body.tipos.FUTBOL_7.DOMINGO).toEqual({ estado: 'CERRADO' });
    expect(body.tipos.FUTBOL_7.LUNES.turnos[3]).toMatchObject({
      desde: '17:00',
      hasta: '20:00',
      total: '83.33',
    });
    expect(body.tipos.FUTBOL_7.LUNES.sinTurno).toEqual({
      desde: '20:00',
      hasta: '22:00',
    });
    expect(await prisma.horarioDeAtencion.count()).toBe(0);
    expect(await prisma.tarifaDeCancha.count()).toBe(0);
  });

  it('dice qué dato del horario o de la tarifa no sirve', async () => {
    const datos = unaSimulacion();
    datos.horario.dias[1] = { ...datos.horario.dias[1], cierra: '07:00' };
    datos.tarifas = [{ ...FUTBOL_7, precioNoche: '0' }];

    const { body } = await simular(datos)
      .set('Cookie', administrador)
      .expect(400);

    expect(body.errores).toEqual({
      'horario.MARTES.cierra': 'El cierre debe ser después de la apertura.',
      'FUTBOL_7.precioNoche': 'El monto debe ser mayor que cero.',
    });
  });

  it('responde 400 a campos de más y a tipos de cancha que no existen', async () => {
    await simular({ ...unaSimulacion(), extra: true })
      .set('Cookie', administrador)
      .expect(400);
    await simular({
      ...unaSimulacion(),
      tarifas: [{ ...FUTBOL_7, tipo: 'FUTBOL_11' }],
    })
      .set('Cookie', administrador)
      .expect(400);
  });

  it('solo administración simula', async () => {
    const jugador = await sesionDeJugador(app);

    await simular(unaSimulacion()).set('Cookie', jugador).expect(403);
    await simular(unaSimulacion()).expect(401);
  });
});
