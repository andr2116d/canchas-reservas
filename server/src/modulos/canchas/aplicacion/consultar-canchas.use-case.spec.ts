import { EnMemoriaBloqueoRepository } from '../../../../test/dobles/en-memoria-bloqueo.repository';
import { EnMemoriaCanchaRepository } from '../../../../test/dobles/en-memoria-cancha.repository';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { ReservasDeCanchaDePrueba } from '../../../../test/dobles/reservas-de-cancha-de-prueba';
import { unaCanchaValida } from '../../../../test/fabricas/datos-cancha';
import { Bloqueo } from '../dominio/bloqueo.entity';
import { Cancha } from '../dominio/cancha.entity';
import { ConsultarCanchasUseCase } from './consultar-canchas.use-case';

describe('ConsultarCanchasUseCase', () => {
  let canchas: EnMemoriaCanchaRepository;
  let reservas: ReservasDeCanchaDePrueba;
  let bloqueos: EnMemoriaBloqueoRepository;
  let consultar: ConsultarCanchasUseCase;
  const enLima = (texto: string) => new Date(`${texto}:00.000-05:00`);

  beforeEach(async () => {
    canchas = new EnMemoriaCanchaRepository();
    reservas = new ReservasDeCanchaDePrueba();
    bloqueos = new EnMemoriaBloqueoRepository();
    consultar = new ConsultarCanchasUseCase({
      canchas,
      reservas,
      bloqueos,
      reloj: new RelojDePrueba(enLima('2026-11-24T10:30')),
    });
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

  it('dice si cada cancha está en mantenimiento ahora y cuál es su próximo bloqueo', async () => {
    const bloqueo = (canchaId: number, inicio: string, fin: string) =>
      Bloqueo.crear({
        canchaId,
        tipo: 'EMERGENCIA',
        motivo: 'Reflector roto.',
        inicio: enLima(inicio),
        fin: enLima(fin),
      });
    await bloqueos.registrar(
      [
        bloqueo(1, '2026-11-24T08:00', '2026-11-24T14:00'),
        bloqueo(1, '2026-11-28T07:00', '2026-11-28T10:00'),
      ],
      { ejecutadoPorId: 7, ocurridoEn: enLima('2026-11-24T08:00') },
    );

    const [primera, segunda] = await consultar.listar();

    expect(primera.mantenimiento).toEqual({
      hasta: '2026-11-24T19:00:00.000Z',
      tipo: 'EMERGENCIA',
    });
    expect(primera.proximoMantenimiento).toEqual({
      inicio: '2026-11-28T12:00:00.000Z',
      fin: '2026-11-28T15:00:00.000Z',
    });
    expect(segunda).toMatchObject({
      mantenimiento: null,
      proximoMantenimiento: null,
    });
  });
});
