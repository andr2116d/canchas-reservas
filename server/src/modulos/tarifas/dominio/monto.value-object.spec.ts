import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { Monto } from './monto.value-object';

describe('Monto', () => {
  it.each([
    ['50', 5000],
    ['49.90', 4990],
    ['49,9', 4990],
    [' 100 ', 10000],
    ['0.50', 50],
  ])('lee «%s» como %i céntimos', (texto, centimos) => {
    expect(Monto.crear(texto).centimos).toBe(centimos);
  });

  it.each([
    ['', 'Ingresa el monto.'],
    ['0', 'El monto debe ser mayor que cero.'],
    ['0.00', 'El monto debe ser mayor que cero.'],
    ['-10', 'Ingresa el monto en soles, por ejemplo 50 o 49.90.'],
    ['cincuenta', 'Ingresa el monto en soles, por ejemplo 50 o 49.90.'],
    ['1e3', 'Ingresa el monto en soles, por ejemplo 50 o 49.90.'],
    ['49.999', 'Usa como máximo dos decimales.'],
    ['100000', 'El monto no puede pasar de S/ 99999.99.'],
  ])('rechaza «%s»: %s', (texto, mensaje) => {
    expect(() => Monto.crear(texto)).toThrow(new ValorInvalidoError(mensaje));
  });

  it('se muestra en soles con dos decimales', () => {
    expect(Monto.crear('49.9').enSoles()).toBe('49.90');
    expect(Monto.desdeCentimos(8333).enSoles()).toBe('83.33');
  });
});
