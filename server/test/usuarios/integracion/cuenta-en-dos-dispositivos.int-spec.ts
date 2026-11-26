import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { cookieDe } from '../../compartido/soporte/cookie-de-sesion';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  administradorSinDatos,
  iniciarSesion,
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';
import { datosDelAdministrador } from '../fabricas/datos-del-personal';

const estados = (respuestas: { status: number }[]) =>
  respuestas.map((respuesta) => respuesta.status).sort((a, b) => a - b);

describe('La misma cuenta usada desde varios dispositivos a la vez', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());

  it('muchos cambios de datos a la vez no se saltan el límite de 10 por hora', async () => {
    const jugador = await sesionDeJugador(app);

    const respuestas = await Promise.all(
      Array.from({ length: 14 }, (_, vez) =>
        api()
          .patch('/api/cuenta')
          .set('Cookie', jugador)
          .send({ celular: `91100${String(vez).padStart(4, '0')}` }),
      ),
    );

    const hechos = respuestas.filter((r) => r.status === 204).length;
    expect(estados(respuestas)).not.toContain(500);
    expect(hechos).toBe(10);
  });

  it('dos cambios de contraseña a la vez desde dos sesiones: solo uno se aplica', async () => {
    await sesionDeJugador(app);
    const sesiones = await Promise.all(
      [1, 2, 3, 4].map(async () =>
        cookieDe(
          await iniciarSesion(app, 'valeria.leon@gmail.com', 'pichanga10'),
        ),
      ),
    );

    const respuestas = await Promise.all(
      sesiones.map((sesion, vez) =>
        api()
          .patch('/api/cuenta/contrasena')
          .set('Cookie', sesion)
          .send({ actual: 'pichanga10', contrasena: `nuevaClave${vez}` }),
      ),
    );

    expect(respuestas.filter((r) => r.status === 200)).toHaveLength(1);
    expect(estados(respuestas)).not.toContain(500);
    expect(
      await prisma.sesion.count({ where: { usuario: { rol: 'JUGADOR' } } }),
    ).toBe(1);
  });

  it('confirmar los datos dos veces a la vez los guarda una vez y al otro le dice que ya están', async () => {
    const sesion = await administradorSinDatos(app);

    const respuestas = await Promise.all(
      [1, 2].map(() =>
        api()
          .post('/api/cuenta/datos')
          .set('Cookie', sesion)
          .send(datosDelAdministrador()),
      ),
    );

    expect(estados(respuestas)).toEqual([204, 409]);
    expect(
      await prisma.registroAuditoria.count({
        where: { accion: 'CONFIRMACION_DE_DATOS' },
      }),
    ).toBe(1);
  });

  it('el cambio único de tipo de documento pedido dos veces a la vez se aplica una sola vez', async () => {
    const temporal = await administradorSinDatos(app);
    await api()
      .post('/api/cuenta/datos')
      .set('Cookie', temporal)
      .send(datosDelAdministrador())
      .expect(204);
    const sesion = cookieDe(
      await api()
        .patch('/api/sesiones/contrasena-temporal')
        .set('Cookie', temporal)
        .send({ contrasena: 'definitiva2026' })
        .expect(200),
    );

    const respuestas = await Promise.all(
      ['C00000001', 'C00000002'].map((numeroDocumento) =>
        api().patch('/api/cuenta/documento').set('Cookie', sesion).send({
          tipoDocumento: 'CARNE_EXTRANJERIA',
          numeroDocumento,
          aceptaAviso: true,
        }),
      ),
    );

    expect(estados(respuestas)).toEqual([204, 409]);
    expect(
      await prisma.registroAuditoria.count({
        where: { accion: 'CAMBIO_DE_DOCUMENTO' },
      }),
    ).toBe(1);
  });

  it('dos administradores que toman el mismo correo a la vez: uno lo obtiene y el otro recibe un aviso', async () => {
    const una = await sesionDeAdministrador(app, 'una@laprevia.pe');
    const otra = await sesionDeAdministrador(app, 'otra@laprevia.pe');

    const respuestas = await Promise.all(
      [una, otra].map((sesion) =>
        api()
          .patch('/api/cuenta')
          .set('Cookie', sesion)
          .send({ correo: 'direccion@laprevia.pe' }),
      ),
    );

    expect(estados(respuestas)).toEqual([204, 409]);
  });
});
