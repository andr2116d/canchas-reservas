import { indiceUnicoViolado } from './indice-unico-violado';

function errorDeUnicidad(indice: string) {
  return {
    code: 'P2002',
    meta: {
      driverAdapterError: { cause: { constraint: { index: indice } } },
    },
  };
}

describe('indiceUnicoViolado', () => {
  it('devuelve el índice único que rechazó la escritura', () => {
    expect(indiceUnicoViolado(errorDeUnicidad('usuario_correo_hash_key'))).toBe(
      'usuario_correo_hash_key',
    );
  });

  it.each([
    ['otro código de Prisma', { code: 'P2025' }],
    ['un error común', new Error('falla')],
    ['un valor que no es error', 'texto'],
    ['nada', undefined],
  ])('no devuelve nada ante %s', (_, error) => {
    expect(indiceUnicoViolado(error)).toBeUndefined();
  });
});
