import type { Cifrador } from '../../aplicacion/cifrador.port';
import { nombreDelAutor } from './nombre-del-autor';

const conPrefijo: Pick<Cifrador, 'descifrar'> = {
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
