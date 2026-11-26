import { idDeRuta } from './id-de-ruta.pipe';

class NoExiste extends Error {}

describe('idDeRuta', () => {
  const pipe = idDeRuta(() => new NoExiste());

  it.each(['1', '42', '2147483647'])('acepta el id %s', (valor) => {
    expect(pipe.transform(valor, { type: 'param' })).toBe(Number(valor));
  });

  it.each(['0', '-5', '2147483648', '99999999999', '1e3', '1.5', 'abc', ''])(
    'responde que no existe ante «%s»',
    (valor) => {
      expect(() => pipe.transform(valor, { type: 'param' })).toThrow(NoExiste);
    },
  );
});
