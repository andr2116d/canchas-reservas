import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../soporte/sesiones-de-prueba';

const DEL_NEGOCIO = {
  rangos: [
    { desdeHoras: '2', porcentaje: '100', ofreceCredito: true },
    { desdeHoras: '1', porcentaje: '50', ofreceCredito: false },
    { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
  ],
};

describe('Regla de cancelación', () => {
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
  const definir = (datos: object = DEL_NEGOCIO) =>
    api().put('/api/cancelacion/regla').send(datos);

  it('el administrador define la regla y queda una versión con quién la guardó', async () => {
    const { body } = await definir().set('Cookie', administrador).expect(200);

    expect(body.cambio).toBe(true);
    expect(body.vigente.guardadaPor).toBe('Valeria León Paredes');
    expect(body.vigente.rangos[0]).toEqual({
      desdeHoras: 2,
      porcentaje: 100,
      ofreceCredito: true,
    });
    expect(await prisma.rangoDeCancelacion.count()).toBe(3);
  });

  it('guardar lo mismo, aunque sea al mismo tiempo, no crea otra versión; un cambio sí', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => definir().set('Cookie', administrador)),
    );
    await definir({
      rangos: [{ desdeHoras: '0', porcentaje: '100', ofreceCredito: false }],
    })
      .set('Cookie', administrador)
      .expect(200);

    const { body } = await api()
      .get('/api/cancelacion/regla')
      .set('Cookie', administrador)
      .expect(200);

    expect(body.historial).toHaveLength(2);
    expect(body.historial[1].rangos).toHaveLength(3);
    expect(body.vigente.rangos).toEqual([
      { desdeHoras: 0, porcentaje: 100, ofreceCredito: false },
    ]);
  });

  it('rechaza horas o porcentajes negativos, vacíos o fuera de rango, sin guardar nada', async () => {
    const { body } = await definir({
      rangos: [
        { desdeHoras: '-1', porcentaje: '100', ofreceCredito: false },
        { desdeHoras: '0', porcentaje: '', ofreceCredito: false },
      ],
    })
      .set('Cookie', administrador)
      .expect(400);

    expect(body.errores).toEqual({
      'rangos.0.desdeHoras': 'Usa horas enteras de 0 a 720.',
      'rangos.1.porcentaje': 'Ingresa el porcentaje que se devuelve.',
    });
    expect(await prisma.reglaDeCancelacion.count()).toBe(0);
  });

  it('no deja negar la devolución en todos los casos', async () => {
    const { body } = await definir({
      rangos: [{ desdeHoras: '0', porcentaje: '0', ofreceCredito: false }],
    })
      .set('Cookie', administrador)
      .expect(400);

    expect(body.errores['rangos.0.porcentaje']).toMatch(
      /no se permite negar la devolución/,
    );
  });

  it('simula una cancelación con la regla en edición, sin guardar nada', async () => {
    const { body } = await api()
      .post('/api/cancelacion/simulacion')
      .send({
        ...DEL_NEGOCIO,
        anticipo: '50',
        pagado: '100',
        minutosDeAnticipacion: 90,
      })
      .set('Cookie', administrador)
      .expect(200);

    expect(body).toEqual({
      desdeHoras: 1,
      porcentaje: 50,
      formas: ['DINERO'],
      devolucionDelAnticipo: '25.00',
      retenido: '25.00',
      excedente: '50.00',
      totalADevolver: '75.00',
    });
    expect(await prisma.reglaDeCancelacion.count()).toBe(0);
  });

  it('responde 400 a campos de más y a minutos que no son enteros', async () => {
    await definir({ ...DEL_NEGOCIO, activa: false })
      .set('Cookie', administrador)
      .expect(400);
    await api()
      .post('/api/cancelacion/simulacion')
      .send({
        ...DEL_NEGOCIO,
        anticipo: '50',
        pagado: '50',
        minutosDeAnticipacion: 'mucho',
      })
      .set('Cookie', administrador)
      .expect(400);
  });

  it('solo administración crea, modifica, consulta y simula la regla', async () => {
    const jugador = await sesionDeJugador(app);

    await definir().set('Cookie', jugador).expect(403);
    await api()
      .get('/api/cancelacion/regla')
      .set('Cookie', jugador)
      .expect(403);
    await api()
      .post('/api/cancelacion/simulacion')
      .send({})
      .set('Cookie', jugador)
      .expect(403);
    await definir().expect(401);
  });

  it('la base también rechaza crédito en un rango que no devuelve nada', async () => {
    const admin = await prisma.usuario.findFirstOrThrow({
      where: { rol: 'ADMINISTRADOR' },
    });

    await expect(
      prisma.reglaDeCancelacion.create({
        data: {
          guardadaPorId: admin.id,
          rangos: {
            create: { desdeHoras: 0, porcentaje: 0, ofreceCredito: true },
          },
        },
      }),
    ).rejects.toThrow();
  });
});
