import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { EnMemoriaCanchaRepository } from '../../../../test/canchas/dobles/en-memoria-cancha.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { ReservasDeCanchaDePrueba } from '../../../../test/canchas/dobles/reservas-de-cancha-de-prueba';
import { unaCanchaValida } from '../../../../test/canchas/fabricas/datos-cancha';
import { Cancha } from '../dominio/cancha.entity';
import { DesactivarCanchaUseCase } from './desactivar-cancha.use-case';
import { EliminarCanchaUseCase } from './eliminar-cancha.use-case';
import { ReactivarCanchaUseCase } from './reactivar-cancha.use-case';

const ADMINISTRADOR = 7;

describe('Estado de una cancha', () => {
  let canchas: EnMemoriaCanchaRepository;
  let reservas: ReservasDeCanchaDePrueba;
  let reloj: RelojDePrueba;

  beforeEach(async () => {
    canchas = new EnMemoriaCanchaRepository();
    reservas = new ReservasDeCanchaDePrueba();
    reloj = new RelojDePrueba(new Date('2026-11-23T15:00:00.000Z'));
    await canchas.registrar([Cancha.crear(unaCanchaValida())], {
      ejecutadoPorId: ADMINISTRADOR,
      ocurridoEn: reloj.ahora(),
    });
    canchas.auditoria.length = 0;
  });

  const desactivar = () =>
    new DesactivarCanchaUseCase(canchas, reservas, reloj).ejecutar(
      1,
      ADMINISTRADOR,
    );
  const eliminar = () =>
    new EliminarCanchaUseCase(canchas, reservas, reloj).ejecutar(
      1,
      ADMINISTRADOR,
    );

  it('desactiva una cancha sin reservas por jugar y lo deja en la auditoría', async () => {
    reservas.reservar(1, '2026-11-20T23:00:00.000Z');

    await desactivar();

    expect((await canchas.buscar(1))?.ficha.estado).toBe('DESACTIVADA');
    expect(canchas.auditoria).toEqual([
      expect.objectContaining({
        accion: 'DESACTIVACION',
        ejecutadoPorId: ADMINISTRADOR,
        ocurridoEn: reloj.ahora(),
      }),
    ]);
  });

  it('no desactiva una cancha con una reserva en juego', async () => {
    reservas.reservar(1, '2026-11-23T14:30:00.000Z');

    await expect(desactivar()).rejects.toThrow(ConflictoError);
  });

  it('no desactiva una cancha con reservas por jugar, ni siquiera de hoy, y las lista', async () => {
    reservas.reservar(1, '2026-11-23T23:00:00.000Z', 'M. Quispe');

    const error = await desactivar().catch((e: unknown) => e);

    expect(error).toEqual(
      new ConflictoError(
        'No se puede desactivar: la cancha tiene reservas por jugar.',
        {},
      ),
    );
    expect((error as ConflictoError).datos).toEqual({
      reservas: [
        {
          inicio: '2026-11-23T23:00:00.000Z',
          fin: '2026-11-24T00:00:00.000Z',
          titular: 'M. Quispe',
        },
      ],
    });
    expect((await canchas.buscar(1))?.ficha.estado).toBe('OPERATIVA');
  });

  it('reactiva una cancha desactivada y lo deja en la auditoría', async () => {
    await desactivar();

    await new ReactivarCanchaUseCase(canchas, reloj).ejecutar(1, ADMINISTRADOR);

    expect((await canchas.buscar(1))?.ficha.estado).toBe('OPERATIVA');
    expect(canchas.auditoria.at(-1)?.accion).toBe('REACTIVACION');
  });

  it('elimina una cancha que nunca tuvo reservas; la auditoría conserva su nombre', async () => {
    await eliminar();

    expect(await canchas.buscar(1)).toBeUndefined();
    expect(canchas.auditoria).toEqual([
      expect.objectContaining({
        accion: 'ELIMINACION',
        nombreDeLaCancha: 'Cancha 1',
      }),
    ]);
  });

  it('no elimina una cancha que tuvo reservas: solo se puede desactivar', async () => {
    reservas.reservar(1, '2026-11-01T23:00:00.000Z');

    await expect(eliminar()).rejects.toThrow(
      'La cancha tiene reservas registradas. Desactívala en lugar de eliminarla.',
    );
    expect(await canchas.buscar(1)).toBeDefined();
  });
});
