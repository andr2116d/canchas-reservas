import {
  ConflictoError,
  NoEncontradoError,
} from '../../../compartido/dominio/dominio.error';
import { EnMemoriaCanchaRepository } from '../../../../test/canchas/dobles/en-memoria-cancha.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import { ReservasDeCanchaDePrueba } from '../../../../test/canchas/dobles/reservas-de-cancha-de-prueba';
import { unaCanchaValida } from '../../../../test/canchas/fabricas/datos-cancha';
import { Cancha } from '../dominio/cancha.entity';
import { EditarCanchaUseCase } from './editar-cancha.use-case';

const ADMINISTRADOR = 7;

describe('EditarCanchaUseCase', () => {
  let canchas: EnMemoriaCanchaRepository;
  let reservas: ReservasDeCanchaDePrueba;
  let editar: EditarCanchaUseCase;

  beforeEach(async () => {
    canchas = new EnMemoriaCanchaRepository();
    reservas = new ReservasDeCanchaDePrueba();
    editar = new EditarCanchaUseCase(canchas, reservas, new RelojDePrueba());
    await canchas.registrar(
      [
        Cancha.crear(unaCanchaValida({ nombre: 'Cancha 1' })),
        Cancha.crear(unaCanchaValida({ nombre: 'Cancha 2' })),
      ],
      { ejecutadoPorId: ADMINISTRADOR, ocurridoEn: new Date() },
    );
    canchas.auditoria.length = 0;
  });

  it('guarda los datos nuevos y audita el valor anterior y el nuevo', async () => {
    const editada = await editar.ejecutar(
      1,
      unaCanchaValida({ nombre: 'Cancha Uno', caracteristicas: [] }),
      ADMINISTRADOR,
    );

    expect(editada.nombre).toBe('Cancha Uno');
    expect(canchas.auditoria).toEqual([
      expect.objectContaining({
        accion: 'EDICION',
        detalle: {
          nombre: { antes: 'Cancha 1', despues: 'Cancha Uno' },
          caracteristicas: { antes: ['BANCAS'], despues: [] },
        },
      }),
    ]);
  });

  it('guardar los mismos datos no deja nada en la auditoría', async () => {
    await editar.ejecutar(1, unaCanchaValida(), ADMINISTRADOR);

    expect(canchas.auditoria).toEqual([]);
  });

  it('rechaza el nombre de otra cancha', async () => {
    const error = await editar
      .ejecutar(1, unaCanchaValida({ nombre: 'cancha 2' }), ADMINISTRADOR)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictoError);
    expect((error as ConflictoError).errores).toEqual({
      nombre: 'Ya existe una cancha llamada «cancha 2».',
    });
  });

  it('responde que no existe si el id no es de ninguna cancha', async () => {
    await expect(
      editar.ejecutar(99, unaCanchaValida(), ADMINISTRADOR),
    ).rejects.toThrow(new NoEncontradoError('No encontramos la cancha.'));
  });

  it('con reservas por jugar no deja cambiar el tamaño ni quitar la luz, y las lista', async () => {
    reservas.reservar(1, '2026-11-28T00:00:00.000Z');

    for (const cambio of [{ tipo: 'FUTBOL_7' }, { tieneIluminacion: false }]) {
      const error = await editar
        .ejecutar(1, unaCanchaValida(cambio), ADMINISTRADOR)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictoError);
      expect((error as ConflictoError).datos).toEqual({
        reservas: [
          {
            inicio: '2026-11-28T00:00:00.000Z',
            fin: '2026-11-28T01:00:00.000Z',
            titular: 'R. Castillo',
          },
        ],
      });
    }
    expect((await canchas.buscar(1))?.ficha.tipo).toBe('FUTBOL_5');
  });

  it('con reservas por jugar sí deja cambiar el nombre, los detalles o la nota', async () => {
    reservas.reservar(1, '2026-11-28T00:00:00.000Z');

    const editada = await editar.ejecutar(
      1,
      unaCanchaValida({ nombre: 'La Grande', nota: 'Pegada a la pared.' }),
      ADMINISTRADOR,
    );

    expect(editada.nota).toBe('Pegada a la pared.');
    expect(editada.sePuedeEliminar).toBe(false);
  });
});
