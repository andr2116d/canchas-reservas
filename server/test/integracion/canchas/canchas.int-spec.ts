import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unaCanchaValida } from '../../fabricas/datos-cancha';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../../soporte/sesiones-de-prueba';

describe('Canchas', () => {
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
  const registrar = (canchas: object[]) =>
    api().post('/api/canchas').set('Cookie', administrador).send({ canchas });
  const listar = async () =>
    (await api().get('/api/canchas').set('Cookie', administrador).expect(200))
      .body as { id: number; nombre: string; estado: string }[];
  const cambios = async () =>
    (
      await api()
        .get('/api/canchas/cambios')
        .set('Cookie', administrador)
        .expect(200)
    ).body as { accion: string; nombreDeLaCancha: string }[];

  it('registra varias canchas a la vez, operativas y con sus datos', async () => {
    const { body } = await registrar([
      unaCanchaValida({ nombre: 'Cancha 1' }),
      unaCanchaValida({
        nombre: 'La Grande',
        tipo: 'FUTBOL_7',
        tieneIluminacion: false,
        caracteristicas: ['GRADERIAS', 'TECHADA'],
        nota: 'Junto al estacionamiento.',
      }),
    ]).expect(201);

    expect(body[1]).toEqual({
      id: 2,
      nombre: 'La Grande',
      tipo: 'FUTBOL_7',
      tieneIluminacion: false,
      caracteristicas: ['TECHADA', 'GRADERIAS'],
      nota: 'Junto al estacionamiento.',
      estado: 'OPERATIVA',
      sePuedeEliminar: true,
    });
    expect((await listar()).map((c) => c.nombre)).toEqual([
      'Cancha 1',
      'La Grande',
    ]);
  });

  it('si falta un dato obligatorio no guarda ninguna y dice cuál falta', async () => {
    const { body } = await registrar([
      unaCanchaValida(),
      { nombre: 'Cancha 2', tipo: 'FUTBOL_5', caracteristicas: [] },
    ]).expect(400);

    expect(body.errores).toEqual({
      'canchas.1.tieneIluminacion':
        'Indica si tiene iluminación para la noche.',
    });
    expect(await prisma.cancha.count()).toBe(0);
  });

  it('si el nombre ya existe no guarda y lo dice', async () => {
    await registrar([unaCanchaValida({ nombre: 'Peña' })]).expect(201);

    const { body } = await registrar([
      unaCanchaValida({ nombre: 'Cancha 2' }),
      unaCanchaValida({ nombre: 'pena' }),
    ]).expect(409);

    expect(body.errores).toEqual({
      'canchas.1.nombre': 'Ya existe una cancha llamada «pena».',
    });
    expect(await prisma.cancha.count()).toBe(1);
  });

  it('dos altas al mismo tiempo con el mismo nombre guardan solo una', async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 4 }, () =>
        registrar([unaCanchaValida({ nombre: 'Cancha 9' })]),
      ),
    );

    expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
    expect(respuestas.filter((r) => r.status === 409)).toHaveLength(3);
    expect(await prisma.cancha.count()).toBe(1);
  });

  it('edita una cancha y la auditoría guarda quién, cuándo y qué cambió', async () => {
    await registrar([unaCanchaValida()]).expect(201);

    await api()
      .put('/api/canchas/1')
      .set('Cookie', administrador)
      .send(unaCanchaValida({ nombre: 'Cancha Uno', tieneIluminacion: false }))
      .expect(200);

    expect((await cambios())[0]).toEqual({
      accion: 'EDICION',
      nombreDeLaCancha: 'Cancha Uno',
      ejecutadoPor: 'Valeria León Paredes',
      ocurridoEn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      detalle: {
        nombre: { antes: 'Cancha 1', despues: 'Cancha Uno' },
        tieneIluminacion: { antes: true, despues: false },
      },
    });
  });

  it('no deja editar con el nombre de otra cancha', async () => {
    await registrar([
      unaCanchaValida({ nombre: 'Cancha 1' }),
      unaCanchaValida({ nombre: 'Cancha 2' }),
    ]).expect(201);

    const { body } = await api()
      .put('/api/canchas/1')
      .set('Cookie', administrador)
      .send(unaCanchaValida({ nombre: 'CANCHA 2' }))
      .expect(409);

    expect(body.errores).toEqual({
      nombre: 'Ya existe una cancha llamada «CANCHA 2».',
    });
  });

  it('desactiva y reactiva una cancha, y cada paso queda en la auditoría', async () => {
    await registrar([unaCanchaValida()]).expect(201);
    const accion = (ruta: string) =>
      api().post(`/api/canchas/1/${ruta}`).set('Cookie', administrador);

    await accion('desactivacion').expect(204);
    expect((await listar())[0].estado).toBe('DESACTIVADA');
    const { body } = await accion('desactivacion').expect(409);
    expect(body.mensaje).toBe('La cancha ya está desactivada.');
    await accion('reactivacion').expect(204);

    expect((await cambios()).map((c) => c.accion)).toEqual([
      'REACTIVACION',
      'DESACTIVACION',
      'ALTA',
    ]);
  });

  it('elimina una cancha sin reservas; la auditoría conserva su nombre', async () => {
    await registrar([unaCanchaValida({ nombre: 'Por error' })]).expect(201);

    await api()
      .delete('/api/canchas/1')
      .set('Cookie', administrador)
      .expect(204);

    expect(await listar()).toEqual([]);
    expect(
      (await cambios()).map((c) => [c.accion, c.nombreDeLaCancha]),
    ).toEqual([
      ['ELIMINACION', 'Por error'],
      ['ALTA', 'Por error'],
    ]);
  });

  it('responde que no existe a un id que no es de ninguna cancha', async () => {
    for (const id of ['99', 'abc']) {
      const { body } = await api()
        .post(`/api/canchas/${id}/desactivacion`)
        .set('Cookie', administrador)
        .expect(404);
      expect(body.mensaje).toBe('No encontramos la cancha.');
    }
  });
});
