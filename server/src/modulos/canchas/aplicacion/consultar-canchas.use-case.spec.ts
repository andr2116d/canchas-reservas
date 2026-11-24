import { EnMemoriaCanchaRepository } from '../../../../test/dobles/en-memoria-cancha.repository';
import { ReservasDeCanchaDePrueba } from '../../../../test/dobles/reservas-de-cancha-de-prueba';
import { unaCanchaValida } from '../../../../test/fabricas/datos-cancha';
import { Cancha } from '../dominio/cancha.entity';
import { ConsultarCanchasUseCase } from './consultar-canchas.use-case';

describe('ConsultarCanchasUseCase', () => {
  let canchas: EnMemoriaCanchaRepository;
  let reservas: ReservasDeCanchaDePrueba;
  let consultar: ConsultarCanchasUseCase;

  beforeEach(async () => {
    canchas = new EnMemoriaCanchaRepository();
    reservas = new ReservasDeCanchaDePrueba();
    consultar = new ConsultarCanchasUseCase(canchas, reservas);
    await canchas.registrar(
      [
        Cancha.crear(unaCanchaValida({ nombre: 'Cancha 1' })),
        Cancha.crear(unaCanchaValida({ nombre: 'Cancha 2' })),
      ],
      { ejecutadoPorId: 7, ocurridoEn: new Date('2026-11-23T15:00:00Z') },
    );
  });

  it('lista las canchas e indica cuáles se pueden eliminar', async () => {
    reservas.reservar(2, '2026-11-01T23:00:00.000Z');

    const lista = await consultar.listar();

    expect(lista.map((c) => [c.id, c.nombre, c.sePuedeEliminar])).toEqual([
      [1, 'Cancha 1', true],
      [2, 'Cancha 2', false],
    ]);
  });

  it('devuelve los cambios más recientes primero', async () => {
    const cambios = await consultar.cambios();

    expect(cambios.map((c) => c.nombreDeLaCancha)).toEqual([
      'Cancha 2',
      'Cancha 1',
    ]);
    expect(cambios[0]).toMatchObject({
      accion: 'ALTA',
      ejecutadoPor: 'Administración 7',
      ocurridoEn: '2026-11-23T15:00:00.000Z',
      detalle: null,
    });
  });
});
