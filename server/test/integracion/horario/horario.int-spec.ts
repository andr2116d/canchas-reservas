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

function unaSemana(cambios: Record<string, object> = {}) {
  return {
    inicioDeLaNoche: '18:00',
    dias: DIAS.map((dia) => ({
      dia,
      abierto: dia !== 'DOMINGO',
      abre: '08:00',
      cierra: '22:00',
      ...cambios[dia],
    })),
  };
}

describe('Horario de atención', () => {
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
  const definir = (datos: object = unaSemana()) =>
    api().put('/api/horario').send(datos);

  it('el administrador define el horario y queda una versión con quién lo guardó', async () => {
    const { body } = await definir(
      unaSemana({
        SABADO: { inicioDeLaNoche: '17:00' },
        VIERNES: { cierra: '24:00' },
      }),
    )
      .set('Cookie', administrador)
      .expect(200);

    expect(body.cambio).toBe(true);
    expect(body.vigente.guardadoPor).toBe('Valeria León Paredes');
    expect(body.vigente.dias[4]).toEqual({
      dia: 'VIERNES',
      abierto: true,
      abre: '08:00',
      cierra: '24:00',
    });
    expect(body.vigente.dias[6]).toEqual({ dia: 'DOMINGO', abierto: false });
    expect(await prisma.horarioDelDia.count()).toBe(6);
  });

  it('guardar el mismo horario, aunque sea al mismo tiempo, no crea otra versión', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => definir().set('Cookie', administrador)),
    );
    const otra = await definir().set('Cookie', administrador).expect(200);

    expect(otra.body.cambio).toBe(false);
    expect(await prisma.horarioDeAtencion.count()).toBe(1);
  });

  it('la consulta trae el vigente, el historial y la noche por defecto', async () => {
    const vacio = await api()
      .get('/api/horario')
      .set('Cookie', administrador)
      .expect(200);
    expect(vacio.body).toEqual({
      historial: [],
      inicioDeLaNochePorDefecto: '18:00',
    });

    await definir().set('Cookie', administrador).expect(200);
    await definir(unaSemana({ LUNES: { cierra: '23:00' } }))
      .set('Cookie', administrador)
      .expect(200);
    const { body } = await api()
      .get('/api/horario')
      .set('Cookie', administrador)
      .expect(200);

    expect(body.vigente.dias[0].cierra).toBe('23:00');
    expect(body.historial).toHaveLength(2);
  });

  it('rechaza un cierre igual o anterior a la apertura y no guarda nada', async () => {
    const { body } = await definir(
      unaSemana({
        MARTES: { abre: '22:00', cierra: '22:00' },
        MIERCOLES: { cierra: '01:00' },
      }),
    )
      .set('Cookie', administrador)
      .expect(400);

    expect(body.errores).toEqual({
      'MARTES.cierra': 'El cierre debe ser después de la apertura.',
      'MIERCOLES.cierra': 'El cierre debe ser después de la apertura.',
    });
    expect(await prisma.horarioDeAtencion.count()).toBe(0);
  });

  it('responde 400 si faltan días o llegan campos de más', async () => {
    const semana = unaSemana();
    await definir({ ...semana, dias: semana.dias.slice(0, 6) })
      .set('Cookie', administrador)
      .expect(400);
    await definir({ ...semana, extra: 1 })
      .set('Cookie', administrador)
      .expect(400);
    await definir({
      ...semana,
      dias: [{ ...semana.dias[0], precio: 5 }, ...semana.dias.slice(1)],
    })
      .set('Cookie', administrador)
      .expect(400);
  });

  it('solo el administrador define y consulta el horario', async () => {
    const jugador = await sesionDeJugador(app);

    await definir().set('Cookie', jugador).expect(403);
    await api().get('/api/horario').set('Cookie', jugador).expect(403);
    await definir().expect(401);
  });

  it('la base también rechaza un cierre anterior a la apertura', async () => {
    const admin = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'ADMINISTRADOR' },
    });

    await expect(
      prisma.horarioDeAtencion.create({
        data: {
          minutoDeInicioDeLaNoche: 1080,
          guardadoPorId: admin.id,
          dias: {
            create: {
              dia: 'LUNES',
              minutoDeApertura: 600,
              minutoDeCierre: 500,
            },
          },
        },
      }),
    ).rejects.toThrow();
  });
});
