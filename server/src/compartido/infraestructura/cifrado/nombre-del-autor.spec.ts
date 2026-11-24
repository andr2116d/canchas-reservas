import type { Cifrador } from '../../aplicacion/cifrador.port';
import { nombreDelAutor } from './nombre-del-autor';

const alReves: Cifrador = {
  cifrar: (texto) => [...texto].reverse().join(''),
  descifrar: (texto) => [...texto].reverse().join(''),
};

describe('nombreDelAutor', () => {
  it('descifra los nombres y los apellidos y los une con un espacio', () => {
    expect(
      nombreDelAutor(alReves, {
        nombresCifrado: 'airelaV',
        apellidosCifrado: 'nóeL',
      }),
    ).toBe('Valeria León');
  });
});
