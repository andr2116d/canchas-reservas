import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { MinutosParaPagar } from './minutos-para-pagar.value-object';

describe('MinutosParaPagar', () => {
  it.each([
    ['1', 1],
    ['15', 15],
    [' 90 ', 90],
    ['1440', 1440],
  ])('acepta %s minutos enteros de 1 a 1440', (texto, minutos) => {
    expect(MinutosParaPagar.crear(texto).valor).toBe(minutos);
  });

  it.each([['0'], ['1441'], ['-5'], ['15.5'], ['1e2'], ['quince'], ['00015']])(
    'rechaza %s',
    (texto) => {
      expect(() => MinutosParaPagar.crear(texto)).toThrow(
        'Usa un número entero de minutos, de 1 a 1440.',
      );
    },
  );

  it('pide el dato si llega vacío', () => {
    expect(() => MinutosParaPagar.crear('  ')).toThrow(
      new ValorInvalidoError('Ingresa los minutos para pagar.'),
    );
  });

  it('dos plazos con los mismos minutos son iguales', () => {
    expect(
      MinutosParaPagar.crear('30').igualA(MinutosParaPagar.restaurar(30)),
    ).toBe(true);
  });

  it('una reserva vence al acabar el plazo o al empezar el turno, lo que llegue antes', () => {
    const plazo = MinutosParaPagar.restaurar(30);
    const creadaEn = new Date('2026-11-28T15:00:00.000Z');

    expect(
      plazo.vencimiento(creadaEn, new Date('2026-11-28T18:00:00.000Z')),
    ).toEqual(new Date('2026-11-28T15:30:00.000Z'));
    expect(
      plazo.vencimiento(creadaEn, new Date('2026-11-28T15:10:00.000Z')),
    ).toEqual(new Date('2026-11-28T15:10:00.000Z'));
  });
});
