import { crearComponenteDePrueba } from '../../compartido/soporte/crear-componente-de-prueba';
import { unBloqueoValido } from '../fabricas/datos-bloqueo';
import { unaCanchaValida } from '../fabricas/datos-cancha';

// El reloj de prueba marca el 22 de noviembre de 2026 a las 05:00 de Lima.
const RESERVA_DEL_SABADO = '2026-11-28T15:00:00.000Z';

describe('Componente de canchas y bloqueos', () => {
  let componente: Awaited<ReturnType<typeof crearComponenteDePrueba>>;
  let administrador: string;
  let canchaId: number;

  beforeEach(async () => {
    componente = await crearComponenteDePrueba();
    administrador = componente.como('ADMINISTRADOR');
    const { body } = await componente
      .api()
      .post('/api/canchas')
      .set('Cookie', administrador)
      .send({ canchas: [unaCanchaValida()] })
      .expect(201);
    canchaId = body[0].id;
  });
  afterEach(() => componente.app.close());

  const api = () => componente.api();
  const bloqueosGuardados = async () => {
    const { body } = await api()
      .get('/api/bloqueos')
      .set('Cookie', administrador);
    return body.sinTerminar.length + body.terminados.length;
  };

  describe('con reservas por jugar', () => {
    beforeEach(() =>
      componente.dobles.reservas.reservar(canchaId, RESERVA_DEL_SABADO),
    );

    it('no se desactiva y lista las reservas afectadas', async () => {
      const respuesta = await api()
        .post(`/api/canchas/${canchaId}/desactivacion`)
        .set('Cookie', administrador)
        .expect(409);

      expect(respuesta.body.datos.reservas).toHaveLength(1);
      expect(respuesta.body.datos.reservas[0]).toMatchObject({
        titular: 'R. Castillo',
      });
    });

    it('no cambia de tamaño ni pierde la luz, pero sí el nombre y la nota', async () => {
      const editar = (cambios: object) =>
        api()
          .put(`/api/canchas/${canchaId}`)
          .set('Cookie', administrador)
          .send(unaCanchaValida(cambios));

      await editar({ tipo: 'FUTBOL_7' }).expect(409);
      await editar({ tieneIluminacion: false }).expect(409);
      const ok = await editar({
        nombre: 'Cancha Central',
        nota: 'Césped nuevo',
      }).expect(200);

      expect(ok.body).toMatchObject({
        nombre: 'Cancha Central',
        nota: 'Césped nuevo',
      });
    });

    it('no se elimina: se ofrece desactivarla', async () => {
      const respuesta = await api()
        .delete(`/api/canchas/${canchaId}`)
        .set('Cookie', administrador)
        .expect(409);

      expect(respuesta.body.mensaje).toBe(
        'La cancha tiene reservas registradas. Desactívala en lugar de eliminarla.',
      );
    });

    it('un bloqueo programado que choca no se guarda y lista la reserva', async () => {
      const respuesta = await api()
        .post('/api/bloqueos')
        .set('Cookie', administrador)
        .send(unBloqueoValido({ canchaIds: [canchaId] }))
        .expect(409);

      expect(respuesta.body.datos.reservas).toHaveLength(1);
      expect(await bloqueosGuardados()).toBe(0);
    });

    it('un bloqueo de emergencia se guarda igual e informa las reservas afectadas', async () => {
      const respuesta = await api()
        .post('/api/bloqueos')
        .set('Cookie', administrador)
        .send(unBloqueoValido({ canchaIds: [canchaId], tipo: 'EMERGENCIA' }))
        .expect(201);

      expect(respuesta.body.reservasAfectadas).toHaveLength(1);
    });
  });

  describe('bloqueos con datos malos', () => {
    it.each([
      ['una cancha que no existe', { canchaIds: [999] }],
      ['ninguna cancha', { canchaIds: [] }],
      ['el fin antes del inicio', { hastaHora: '07:00' }],
      ['un inicio en el pasado', { desdeFecha: '2026-11-01' }],
      ['un tipo inventado', { tipo: 'CAPRICHO' }],
      ['un motivo vacío', { motivo: '   ' }],
    ])('rechaza %s sin guardar nada', async (_caso, cambios) => {
      const respuesta = await api()
        .post('/api/bloqueos')
        .set('Cookie', administrador)
        .send({ ...unBloqueoValido({ canchaIds: [canchaId] }), ...cambios });

      expect(respuesta.status).toBe(400);
      expect(await bloqueosGuardados()).toBe(0);
    });

    it('dos bloqueos de la misma cancha que se pisan: el segundo responde conflicto', async () => {
      const bloquear = () =>
        api()
          .post('/api/bloqueos')
          .set('Cookie', administrador)
          .send(unBloqueoValido({ canchaIds: [canchaId] }));

      await bloquear().expect(201);
      const respuesta = await bloquear().expect(409);

      expect(respuesta.body.mensaje).toBe('Ya hay un bloqueo en ese rango.');
    });

    it('no bloquea una cancha desactivada', async () => {
      await api()
        .post(`/api/canchas/${canchaId}/desactivacion`)
        .set('Cookie', administrador)
        .expect(204);

      await api()
        .post('/api/bloqueos')
        .set('Cookie', administrador)
        .send(unBloqueoValido({ canchaIds: [canchaId] }))
        .expect(400);
    });
  });
});
