import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { NumeroDeHoja } from './numero-de-hoja.value-object';

describe('NumeroDeHoja', () => {
  it('se escribe con el correlativo de seis cifras y el año', () => {
    expect(NumeroDeHoja.de(2026, 14).texto).toBe('000014-2026');
  });

  it('lee el número escrito por la persona, con o sin ceros y espacios', () => {
    expect(NumeroDeHoja.leer(' 000014-2026 ')).toEqual(
      NumeroDeHoja.de(2026, 14),
    );
    expect(NumeroDeHoja.leer('14-2026')).toEqual(NumeroDeHoja.de(2026, 14));
  });

  it.each([
    '',
    '2026',
    '000014',
    'abc-2026',
    '0-2026',
    '1234567-2026',
    '14-26',
  ])('rechaza «%s» con un mensaje claro', (texto) => {
    expect(() => NumeroDeHoja.leer(texto)).toThrow(
      new ValorInvalidoError(
        'Ingresa el número de hoja como aparece en la constancia, por ejemplo 000014-2026.',
      ),
    );
  });
});
