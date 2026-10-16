import { saltosProxy } from './trust-proxy';

describe('saltosProxy', () => {
  it('sin definir devuelve 0', () => {
    expect(saltosProxy(undefined)).toBe(0);
    expect(saltosProxy('')).toBe(0);
  });

  it('acepta enteros mayores o iguales a 0', () => {
    expect(saltosProxy('0')).toBe(0);
    expect(saltosProxy('2')).toBe(2);
  });

  it.each(['abc', '-1', '1.5', '2abc'])(
    'con "%s" falla indicando la variable',
    (valor) => {
      expect(() => saltosProxy(valor)).toThrow(/TRUST_PROXY_HOPS/);
    },
  );

  it('lee process.env.TRUST_PROXY_HOPS por defecto', () => {
    const original = process.env.TRUST_PROXY_HOPS;
    try {
      process.env.TRUST_PROXY_HOPS = '3';
      expect(saltosProxy()).toBe(3);
    } finally {
      if (original === undefined) delete process.env.TRUST_PROXY_HOPS;
      else process.env.TRUST_PROXY_HOPS = original;
    }
  });
});
