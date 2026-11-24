import { BadRequestException } from '@nestjs/common';
import { TextoNoValidoPipe } from './texto-no-valido.pipe';

describe('TextoNoValidoPipe', () => {
  const pipe = new TextoNoValidoPipe();
  const enCuerpo = (valor: unknown) => pipe.transform(valor, { type: 'body' });
  const errores = (valor: unknown) => {
    try {
      enCuerpo(valor);
    } catch (error) {
      return (
        (error as BadRequestException).getResponse() as { errores: object }
      ).errores;
    }
  };

  it('deja pasar texto normal, saltos de línea, tildes y emojis', () => {
    const cuerpo = {
      nota: 'Arco nuevo\nlínea dos\tñandú 😀',
      precio: 5,
      activo: true,
    };

    expect(enCuerpo(cuerpo)).toBe(cuerpo);
  });

  it.each([
    ['el carácter nulo', 'Ana\u0000'],
    ['un carácter de control', 'Ana\u0007'],
    ['el carácter de borrado', 'Ana\u007f'],
    ['una mitad de emoji suelta', 'Ana\ud83d'],
  ])('rechaza %s y dice en qué campo', (_caso, texto) => {
    expect(errores({ nombres: texto })).toEqual({
      nombres: 'Quita los caracteres no válidos.',
    });
  });

  it('marca la ruta del campo dentro de listas y objetos', () => {
    expect(
      errores({ canchas: [{ nombre: 'ok' }, { nota: 'a\u0000' }] }),
    ).toEqual({
      'canchas.1.nota': 'Quita los caracteres no válidos.',
    });
  });

  it('también revisa los filtros de la consulta y no toca los parámetros de la ruta', () => {
    expect(() =>
      pipe.transform({ buscar: 'a\u0000' }, { type: 'query' }),
    ).toThrow(BadRequestException);
    expect(pipe.transform('a\u0000', { type: 'param' })).toBe('a\u0000');
  });
});
