import type { Cifrador } from '../../aplicacion/cifrador.port';
import { nombreDelAutor } from './nombre-del-autor';

const conPrefijo: Cifrador = {
  cifrar: (texto) => `cifrado:${texto}`,
  descifrar: (cifrado) => cifrado.replace(/^cifrado:/, ''),
};

describe('nombreDelAutor', () => {
  it('descifra los nombres y los apellidos y los une con un espacio', () => {
    expect(
      nombreDelAutor(conPrefijo, {
        nombresCifrado: 'cifrado:Valeria',
        apellidosCifrado: 'cifrado:León',
      }),
    ).toBe('Valeria León');
  });
});
