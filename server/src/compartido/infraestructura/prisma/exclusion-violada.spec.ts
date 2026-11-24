import { exclusionViolada } from './exclusion-violada';

function errorDeExclusion(restriccion: string, codigo = '23P01') {
  return {
    code: 'P2010',
    meta: {
      driverAdapterError: {
        cause: {
          originalCode: codigo,
          originalMessage: `conflicting key value violates exclusion constraint "${restriccion}"`,
        },
      },
    },
  };
}

describe('exclusionViolada', () => {
  it('reconoce la restricción de exclusión que rechazó la escritura', () => {
    expect(
      exclusionViolada(
        errorDeExclusion('bloqueo_sin_cruces_excl'),
        'bloqueo_sin_cruces_excl',
      ),
    ).toBe(true);
  });

  it.each([
    ['otra restricción', errorDeExclusion('otra_excl')],
    [
      'otro código de PostgreSQL',
      errorDeExclusion('bloqueo_sin_cruces_excl', '23505'),
    ],
    ['un error común', new Error('falla')],
    ['nada', undefined],
  ])('no la reconoce ante %s', (_, error) => {
    expect(exclusionViolada(error, 'bloqueo_sin_cruces_excl')).toBe(false);
  });
});
