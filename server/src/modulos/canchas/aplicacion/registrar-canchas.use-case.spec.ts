import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { EnMemoriaCanchaRepository } from '../../../../test/dobles/en-memoria-cancha.repository';
import { RelojDePrueba } from '../../../../test/dobles/reloj-de-prueba';
import { unaCanchaValida } from '../../../../test/fabricas/datos-cancha';
import { RegistrarCanchasUseCase } from './registrar-canchas.use-case';

const ADMINISTRADOR = 7;

describe('RegistrarCanchasUseCase', () => {
  let canchas: EnMemoriaCanchaRepository;
  let reloj: RelojDePrueba;
  let registrar: RegistrarCanchasUseCase;

  beforeEach(() => {
    canchas = new EnMemoriaCanchaRepository();
    reloj = new RelojDePrueba();
    registrar = new RegistrarCanchasUseCase(canchas, reloj);
  });

  async function errorAlRegistrar(lista = [unaCanchaValida()]) {
    return registrar.ejecutar(lista, ADMINISTRADOR).then(
      () => {
        throw new Error('Se esperaba un error.');
      },
      (error: unknown) => error,
    );
  }

  it('crea varias canchas a la vez, todas operativas', async () => {
    const creadas = await registrar.ejecutar(
      [
        unaCanchaValida({ nombre: 'Cancha 1' }),
        unaCanchaValida({ nombre: 'Cancha 2', tipo: 'FUTBOL_7' }),
      ],
      ADMINISTRADOR,
    );

    expect(creadas.map((c) => [c.id, c.nombre, c.tipo, c.estado])).toEqual([
      [1, 'Cancha 1', 'FUTBOL_5', 'OPERATIVA'],
      [2, 'Cancha 2', 'FUTBOL_7', 'OPERATIVA'],
    ]);
  });

  it('deja un alta en la auditoría por cada cancha, con quién y cuándo', async () => {
    await registrar.ejecutar(
      [unaCanchaValida(), unaCanchaValida({ nombre: 'Cancha 2' })],
      ADMINISTRADOR,
    );

    expect(canchas.auditoria).toEqual([
      expect.objectContaining({
        accion: 'ALTA',
        nombreDeLaCancha: 'Cancha 1',
        ejecutadoPorId: ADMINISTRADOR,
        ocurridoEn: reloj.ahora(),
      }),
      expect.objectContaining({ accion: 'ALTA', nombreDeLaCancha: 'Cancha 2' }),
    ]);
  });

  it('informa los errores de cada cancha con su posición y no guarda ninguna', async () => {
    const error = await errorAlRegistrar([
      unaCanchaValida(),
      unaCanchaValida({ nombre: '', tipo: '' }),
    ]);

    expect(error).toBeInstanceOf(ReglaInvalidaError);
    expect((error as ReglaInvalidaError).errores).toEqual({
      'canchas.1.nombre': 'Ingresa el nombre de la cancha.',
      'canchas.1.tipo': 'Elige si es de fútbol 5 o de fútbol 7.',
    });
    expect(await canchas.listar()).toHaveLength(0);
  });

  it('rechaza nombres que se repiten dentro de la misma lista', async () => {
    const error = await errorAlRegistrar([
      unaCanchaValida({ nombre: 'La Única' }),
      unaCanchaValida({ nombre: 'la unica' }),
    ]);

    expect((error as ReglaInvalidaError).errores).toEqual({
      'canchas.1.nombre': 'Este nombre se repite en la lista.',
    });
  });

  it('rechaza un nombre que ya usa otra cancha, sin importar mayúsculas ni tildes', async () => {
    await registrar.ejecutar([unaCanchaValida({ nombre: 'Peña' })], 1);

    const error = await errorAlRegistrar([unaCanchaValida({ nombre: 'PENA' })]);

    expect(error).toBeInstanceOf(ConflictoError);
    expect((error as ConflictoError).errores).toEqual({
      'canchas.0.nombre': 'Ya existe una cancha llamada «PENA».',
    });
    expect(await canchas.listar()).toHaveLength(1);
  });
});
