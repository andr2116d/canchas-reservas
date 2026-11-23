import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';
import type {
  FichaDeRecepcionista,
  RecepcionistaRepository,
} from '../dominio/recepcionista.repository';
import { ConsultarRecepcionistasUseCase } from './consultar-recepcionistas.use-case';

function unaFicha(cambios: Partial<FichaDeRecepcionista> = {}) {
  return {
    id: 1,
    nombres: 'Rosa',
    apellidos: 'Quispe Lozano',
    correo: 'rosa.quispe@laprevia.pe',
    tipoDocumento: 'DNI',
    numeroDocumento: '41234567',
    fechaNacimiento: '1995-02-01',
    celular: '912345678',
    estado: 'ACTIVO',
    requiereCambiarContrasena: true,
    creadaEn: new Date('2026-11-22T15:00:00Z'),
    ...cambios,
  } satisfies FichaDeRecepcionista;
}

function preparar(fichas: FichaDeRecepcionista[]) {
  const recepcionistas: Pick<RecepcionistaRepository, 'listar' | 'buscar'> = {
    listar: (estado) =>
      Promise.resolve(fichas.filter((ficha) => ficha.estado === estado)),
    buscar: (id) => {
      const ficha = fichas.find((candidata) => candidata.id === id);
      return Promise.resolve(ficha && { ficha, historial: [] });
    },
  };
  return new ConsultarRecepcionistasUseCase(recepcionistas);
}

describe('ConsultarRecepcionistasUseCase', () => {
  it('lista solo las del estado pedido, ordenadas por apellidos y nombres', async () => {
    const consultar = preparar([
      unaFicha({ id: 1, apellidos: 'Ruiz' }),
      unaFicha({ id: 2, apellidos: 'Ávila' }),
      unaFicha({ id: 3, apellidos: 'Castro', estado: 'INACTIVO' }),
    ]);

    const activas = await consultar.listar('ACTIVO');

    expect(activas.map((ficha) => ficha.apellidos)).toEqual(['Ávila', 'Ruiz']);
  });

  it('devuelve la ficha con su historial', async () => {
    await expect(preparar([unaFicha()]).ficha(1)).resolves.toEqual({
      ficha: unaFicha(),
      historial: [],
    });
  });

  it('avisa que no existe si el id no es de una recepcionista', async () => {
    await expect(preparar([]).ficha(7)).rejects.toBeInstanceOf(
      NoEncontradoError,
    );
  });
});
