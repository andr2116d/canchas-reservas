import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { unAdicionalValido } from '../../fabricas/datos-adicional';
import { crearAppDePrueba } from '../../soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../soporte/limpiar-tablas';
import { sesionDeAdministrador } from '../../soporte/sesiones-de-prueba';

describe('Adicionales', () => {
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
  const registrar = (datos: object) =>
    api().post('/api/adicionales').set('Cookie', administrador).send(datos);
  const editar = (id: number | string, datos: object) =>
    api()
      .put(`/api/adicionales/${id}`)
      .set('Cookie', administrador)
      .send(datos);
  const listar = async () =>
    (
      await api()
        .get('/api/adicionales')
        .set('Cookie', administrador)
        .expect(200)
    ).body as { id: number; nombre: string; precio: string; estado: string }[];
  const cambios = async () =>
    (
      await api()
        .get('/api/adicionales/cambios')
        .set('Cookie', administrador)
        .expect(200)
    ).body as {
      accion: string;
      nombreDelAdicional: string;
      detalle: unknown;
    }[];

  it('registra un adicional activo con su precio por unidad', async () => {
    const { body } = await registrar(
      unAdicionalValido({ nombre: 'Chalecos', precio: '15.5' }),
    ).expect(201);

    expect(body).toEqual({
      id: 1,
      nombre: 'Chalecos',
      descripcion: 'N.º 5, cuero sintético.',
      precio: '15.50',
      estado: 'ACTIVO',
      sePuedeEliminar: true,
    });
    expect(await listar()).toEqual([body]);
  });

  it('si falta el nombre o el precio es cero, no guarda y dice por qué', async () => {
    const { body } = await registrar({ nombre: '', precio: '0' }).expect(400);

    expect(body.errores).toEqual({
      nombre: 'Ingresa el nombre del adicional.',
      precio: 'El monto debe ser mayor que cero.',
    });
    expect(await prisma.adicional.count()).toBe(0);
  });

  it('rechaza un precio negativo o con letras', async () => {
    for (const precio of ['-10', '1e3', '10 soles']) {
      const { body } = await registrar(unAdicionalValido({ precio })).expect(
        400,
      );
      expect(body.errores).toEqual({
        precio: 'Ingresa el monto en soles, por ejemplo 50 o 49.90.',
      });
    }
  });

  it('si el nombre ya existe no guarda y lo dice', async () => {
    await registrar(unAdicionalValido({ nombre: 'Balón' })).expect(201);

    const { body } = await registrar(
      unAdicionalValido({ nombre: ' balon ' }),
    ).expect(409);

    expect(body.errores).toEqual({
      nombre: 'Ya existe un adicional llamado «balon».',
    });
    expect(await prisma.adicional.count()).toBe(1);
  });

  it('dos altas al mismo tiempo con el mismo nombre guardan solo una', async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 4 }, () => registrar(unAdicionalValido())),
    );

    expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
    expect(respuestas.filter((r) => r.status === 409)).toHaveLength(3);
    expect(await prisma.adicional.count()).toBe(1);
  });

  it('edita el nombre y el precio; la auditoría guarda el antes y el después', async () => {
    await registrar(unAdicionalValido()).expect(201);

    const { body } = await editar(
      1,
      unAdicionalValido({ nombre: 'Pelota', precio: '50' }),
    ).expect(200);

    expect(body).toMatchObject({ nombre: 'Pelota', precio: '50.00' });
    expect((await cambios())[0]).toEqual({
      accion: 'EDICION',
      nombreDelAdicional: 'Pelota',
      ejecutadoPor: 'Valeria León Paredes',
      ocurridoEn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      detalle: {
        nombre: { antes: 'Balón', despues: 'Pelota' },
        precio: { antes: '45.00', despues: '50.00' },
      },
    });
  });

  it('el alta queda en la auditoría con el precio con que se creó', async () => {
    await registrar(unAdicionalValido({ precio: '45' })).expect(201);

    expect((await cambios())[0]).toMatchObject({
      accion: 'ALTA',
      detalle: {
        nombre: 'Balón',
        descripcion: 'N.º 5, cuero sintético.',
        precio: '45.00',
      },
    });
  });

  it('guardar los mismos datos dos veces deja un solo registro', async () => {
    await registrar(unAdicionalValido()).expect(201);

    await editar(1, unAdicionalValido({ precio: '60' })).expect(200);
    await editar(1, unAdicionalValido({ precio: '60.00' })).expect(200);

    expect((await cambios()).map((c) => c.accion)).toEqual(['EDICION', 'ALTA']);
  });

  it('no deja editar con el nombre de otro adicional', async () => {
    await registrar(unAdicionalValido({ nombre: 'Balón' })).expect(201);
    await registrar(unAdicionalValido({ nombre: 'Chalecos' })).expect(201);

    const { body } = await editar(
      1,
      unAdicionalValido({ nombre: 'CHALECOS' }),
    ).expect(409);

    expect(body.errores).toEqual({
      nombre: 'Ya existe un adicional llamado «CHALECOS».',
    });
  });

  it('desactiva y reactiva; repetir no falla ni deja otro registro', async () => {
    await registrar(unAdicionalValido()).expect(201);
    const accion = (ruta: string) =>
      api().post(`/api/adicionales/1/${ruta}`).set('Cookie', administrador);

    await accion('desactivacion').expect(204);
    await accion('desactivacion').expect(204);
    expect((await listar())[0].estado).toBe('DESACTIVADO');
    await accion('reactivacion').expect(204);
    await accion('reactivacion').expect(204);

    expect((await cambios()).map((c) => c.accion)).toEqual([
      'REACTIVACION',
      'DESACTIVACION',
      'ALTA',
    ]);
  });

  it('elimina uno que nunca se usó; la auditoría conserva su nombre', async () => {
    await registrar(unAdicionalValido({ nombre: 'Por error' })).expect(201);

    await api()
      .delete('/api/adicionales/1')
      .set('Cookie', administrador)
      .expect(204);

    expect(await listar()).toEqual([]);
    expect(
      (await cambios()).map((c) => [c.accion, c.nombreDelAdicional]),
    ).toEqual([
      ['ELIMINACION', 'Por error'],
      ['ALTA', 'Por error'],
    ]);
  });

  it('responde que no existe a un id que no es de ningún adicional', async () => {
    for (const id of ['99', 'abc']) {
      const { body } = await editar(id, unAdicionalValido()).expect(404);
      expect(body.mensaje).toBe('No encontramos el adicional.');
    }
  });
});
