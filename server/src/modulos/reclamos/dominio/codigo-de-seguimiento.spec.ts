import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import {
  ALFABETO_DEL_CODIGO,
  formatearCodigo,
  leerCodigo,
} from './codigo-de-seguimiento';

describe('código de seguimiento', () => {
  it('no usa caracteres que se confunden al leerlos (0, O, 1, I)', () => {
    expect(ALFABETO_DEL_CODIGO).not.toMatch(/[0O1I]/);
  });

  it('se muestra en dos grupos de cuatro', () => {
    expect(formatearCodigo('K7QP4ZMD')).toBe('K7QP-4ZMD');
  });

  it('lo escrito por la persona se normaliza: minúsculas, espacios y guion', () => {
    expect(leerCodigo(' k7qp 4zmd ')).toBe('K7QP4ZMD');
    expect(leerCodigo('K7QP-4ZMD')).toBe('K7QP4ZMD');
  });

  it.each(['', 'K7QP4ZM', 'K7QP4ZMD9', 'K7QP-4ZM0'])(
    'rechaza «%s»',
    (texto) => {
      expect(() => leerCodigo(texto)).toThrow(
        new ValorInvalidoError(
          'Ingresa el código de seguimiento de 8 caracteres de la constancia.',
        ),
      );
    },
  );
});
