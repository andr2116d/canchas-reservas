import { crearComponenteDePrueba } from '../../compartido/soporte/crear-componente-de-prueba';
import { unAdicionalValido } from '../fabricas/datos-adicional';

describe('Componente de adicionales', () => {
  let componente: Awaited<ReturnType<typeof crearComponenteDePrueba>>;
  let administrador: string;

  beforeEach(async () => {
    componente = await crearComponenteDePrueba();
    administrador = componente.como('ADMINISTRADOR');
  });
  afterEach(() => componente.app.close());

  const crear = (datos: object = unAdicionalValido()) =>
    componente
      .api()
      .post('/api/adicionales')
      .set('Cookie', administrador)
      .send(datos);

  describe('acceso', () => {
    it.each([
      ['sin sesión', undefined, 401],
      ['un jugador', 'JUGADOR', 403],
      ['recepción', 'RECEPCIONISTA', 403],
    ] as const)('%s no gestiona el catálogo', async (_quien, rol, estado) => {
      const peticion = componente
        .api()
        .post('/api/adicionales')
        .send(unAdicionalValido());
      if (rol) peticion.set('Cookie', componente.como(rol));

      await peticion.expect(estado);
    });

    it('un administrador que aún no completó sus datos no entra', async () => {
      await componente
        .api()
        .get('/api/adicionales')
        .set(
          'Cookie',
          componente.como('ADMINISTRADOR', { requiereCompletarDatos: true }),
        )
        .expect(403);
    });

    it('un administrador con contraseña temporal sin omitir no entra', async () => {
      await componente
        .api()
        .get('/api/adicionales')
        .set(
          'Cookie',
          componente.como('ADMINISTRADOR', { requiereCambiarContrasena: true }),
        )
        .expect(403);
    });
  });

  describe('contrato HTTP', () => {
    it('crea y devuelve la vista, con cabecera para no guardar en caché', async () => {
      const respuesta = await crear().expect(201);

      expect(respuesta.body).toEqual({
        id: expect.any(Number),
        nombre: 'Balón',
        descripcion: 'N.º 5, cuero sintético.',
        precio: '45.00',
        estado: 'ACTIVO',
        sePuedeEliminar: true,
      });
      expect(respuesta.headers['cache-control']).toBe('no-store');
    });

    it.each([
      ['un precio negativo', { precio: '-5' }, 'precio'],
      ['un precio en número', { precio: 5 }, 'precio'],
      ['sin nombre', { nombre: '' }, 'nombre'],
      [
        'una descripción de más de 200 caracteres',
        { descripcion: 'x'.repeat(201) },
        'descripcion',
      ],
      ['un campo de más', { estado: 'DESACTIVADO' }, 'estado'],
    ])('rechaza %s y dice en qué campo', async (_caso, cambios, campo) => {
      const respuesta = await crear({
        ...unAdicionalValido(),
        ...cambios,
      }).expect(400);

      expect(Object.keys(respuesta.body.errores)).toContain(campo);
      expect(await componente.dobles.adicionales.listar()).toHaveLength(0);
    });

    it('un id fuera de rango o con letras responde que no existe', async () => {
      for (const id of ['abc', '1.5', '99999999999'])
        await componente
          .api()
          .put(`/api/adicionales/${id}`)
          .set('Cookie', administrador)
          .send(unAdicionalValido())
          .expect(404);
    });
  });

  describe('reglas del catálogo', () => {
    it('no deja eliminar un adicional ya usado y ofrece desactivarlo', async () => {
      const { body } = await crear().expect(201);
      componente.dobles.usos.usar(body.id);

      const respuesta = await componente
        .api()
        .delete(`/api/adicionales/${body.id}`)
        .set('Cookie', administrador)
        .expect(409);

      expect(respuesta.body.mensaje).toBe(
        'El adicional ya se usó en reservas. Desactívalo en lugar de eliminarlo.',
      );
      const lista = await componente
        .api()
        .get('/api/adicionales')
        .set('Cookie', administrador);
      expect(lista.body[0].sePuedeEliminar).toBe(false);
    });

    it('desactivar dos veces responde igual y no falla', async () => {
      const { body } = await crear().expect(201);
      const desactivar = () =>
        componente
          .api()
          .post(`/api/adicionales/${body.id}/desactivacion`)
          .set('Cookie', administrador);

      await desactivar().expect(204);
      await desactivar().expect(204);
    });

    it('un nombre igual sin importar mayúsculas ni tildes responde conflicto', async () => {
      await crear().expect(201);

      const respuesta = await crear(
        unAdicionalValido({ nombre: '  BALON ' }),
      ).expect(409);

      expect(respuesta.body.errores).toEqual({
        nombre: 'Ya existe un adicional llamado «BALON».',
      });
    });
  });
});
