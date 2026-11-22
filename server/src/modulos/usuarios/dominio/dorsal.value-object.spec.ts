import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { Dorsal } from './dorsal.value-object';

describe('Dorsal', () => {
  it.each([
    ['1', 1],
    ['10', 10],
    ['99', 99],
    ['07', 7],
    [' 23 ', 23],
  ])('acepta "%s" como el dorsal %i', (texto, numero) => {
    expect(Dorsal.crearOpcional(texto)?.numero).toBe(numero);
  });

  it.each([undefined, '', '   '])(
    'es opcional: "%s" significa que no eligió dorsal',
    (texto) => {
      expect(Dorsal.crearOpcional(texto)).toBeUndefined();
    },
  );

  it.each([
    ['1O', 'El dorsal solo debe contener números.'],
    ['-5', 'El dorsal solo debe contener números.'],
    ['7.5', 'El dorsal solo debe contener números.'],
    ['0', 'El dorsal debe estar entre 1 y 99.'],
    ['00', 'El dorsal debe estar entre 1 y 99.'],
    ['100', 'El dorsal debe estar entre 1 y 99.'],
  ])('rechaza "%s": %s', (texto, mensaje) => {
    expect(() => Dorsal.crearOpcional(texto)).toThrow(
      new ValorInvalidoError(mensaje),
    );
  });
});
