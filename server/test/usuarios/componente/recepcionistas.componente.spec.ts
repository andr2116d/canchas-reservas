import { crearComponenteDePrueba } from '../../compartido/soporte/crear-componente-de-prueba';
import { unaRecepcionistaValida } from '../fabricas/datos-recepcionista';

describe('Componente de gestión de recepcionistas', () => {
  let componente: Awaited<ReturnType<typeof crearComponenteDePrueba>>;
  let administrador: string;

  beforeEach(async () => {
    componente = await crearComponenteDePrueba();
    administrador = componente.como('ADMINISTRADOR');
  });
  afterEach(() => componente.app.close());

  const api = () => componente.api();
  const crear = (cambios = {}) =>
    api()
      .post('/api/recepcionistas')
      .set('Cookie', administrador)
      .send(unaRecepcionistaValida(cambios));

  it('responde con el id y sin la contraseña ni datos cifrados', async () => {
    const { body } = await crear().expect(201);

    expect(body).toEqual({ id: expect.any(Number) });
  });

  it.each([
    ['menor de edad', { fechaNacimiento: '2012-01-01' }, 'fechaNacimiento'],
    ['un correo con la @', { usuarioDeCorreo: 'rosa@gmail.com' }, 'correo'],
    ['un DNI de 7 dígitos', { numeroDocumento: '1234567' }, 'numeroDocumento'],
    ['un celular que no empieza en 9', { celular: '812345678' }, 'celular'],
    ['una contraseña corta', { contrasena: 'corta1' }, 'contrasena'],
  ])('rechaza %s y marca el campo', async (_caso, cambios, campo) => {
    const { body } = await crear(cambios).expect(400);

    expect(Object.keys(body.errores)).toContain(campo);
  });

  it('el número de documento no se cambia al editar', async () => {
    const { body } = await crear().expect(201);

    const respuesta = await api()
      .patch(`/api/recepcionistas/${body.id}`)
      .set('Cookie', administrador)
      .send({
        ...unaRecepcionistaValida({ numeroDocumento: '47777777' }),
        contrasena: undefined,
      })
      .expect(400);

    expect(respuesta.body.errores.numeroDocumento).toBe(
      'El documento identifica a la persona y no se puede cambiar.',
    );
  });

  it('reactivar una cuenta activa responde conflicto y no deja registro', async () => {
    const { body } = await crear().expect(201);
    const acciones = componente.dobles.recepcionistas.acciones.length;

    await api()
      .post(`/api/recepcionistas/${body.id}/reactivacion`)
      .set('Cookie', administrador)
      .send({ contrasena: 'nueva2026x' })
      .expect(409);

    expect(componente.dobles.recepcionistas.acciones).toHaveLength(acciones);
  });

  it('una cuenta de otro rol no se gestiona como recepcionista', async () => {
    await api()
      .post('/api/recepcionistas/999/desactivacion')
      .set('Cookie', administrador)
      .expect(404);
  });
});
