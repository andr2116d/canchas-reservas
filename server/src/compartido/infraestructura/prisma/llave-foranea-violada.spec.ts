import { llaveForaneaViolada } from './llave-foranea-violada';

const errorDeLlaveForanea = (restriccion: string) => ({
  code: 'P2003',
  meta: {
    driverAdapterError: { cause: { constraint: { index: restriccion } } },
  },
});

describe('llaveForaneaViolada', () => {
  it('devuelve la llave foránea que impidió borrar o escribir', () => {
    expect(
      llaveForaneaViolada(
        errorDeLlaveForanea('adicional_pedido_adicional_id_fkey'),
      ),
    ).toBe('adicional_pedido_adicional_id_fkey');
  });

  it.each([
    ['un índice único repetido', { code: 'P2002' }],
    ['un error común', new Error('falla')],
    ['nada', undefined],
  ])('no devuelve nada ante %s', (_, error) => {
    expect(llaveForaneaViolada(error)).toBeUndefined();
  });
});
