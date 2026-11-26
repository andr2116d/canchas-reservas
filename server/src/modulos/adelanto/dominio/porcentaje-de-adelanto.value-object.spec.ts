import { Monto } from '../../../compartido/dominio/monto.value-object';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { PorcentajeDeAdelanto } from './porcentaje-de-adelanto.value-object';

const precio = (soles: string) => Monto.crear(soles);

describe('PorcentajeDeAdelanto', () => {
  it('acepta un entero de 1 a 100', () => {
    expect(PorcentajeDeAdelanto.crear('1').valor).toBe(1);
    expect(PorcentajeDeAdelanto.crear(' 50 ').valor).toBe(50);
    expect(PorcentajeDeAdelanto.crear('100').valor).toBe(100);
  });

  it('pide el porcentaje si llega vacío', () => {
    expect(() => PorcentajeDeAdelanto.crear('  ')).toThrow(
      new ValorInvalidoError('Ingresa el porcentaje del adelanto.'),
    );
  });

  it.each(['0', '101', '50.5', '-5', '5%', 'cincuenta', '1e2'])(
    'rechaza %s',
    (texto) => {
      expect(() => PorcentajeDeAdelanto.crear(texto)).toThrow(
        new ValorInvalidoError('Usa un número entero de 1 a 100.'),
      );
    },
  );

  it('calcula el adelanto de un precio', () => {
    const mitad = PorcentajeDeAdelanto.crear('50');

    expect(mitad.adelantoDe(precio('80')).enSoles()).toBe('40.00');
  });

  it('redondea el adelanto a céntimos', () => {
    const tercio = PorcentajeDeAdelanto.crear('33');

    expect(tercio.adelantoDe(precio('83.33')).enSoles()).toBe('27.50');
  });

  it('con 100 % el adelanto es el precio completo', () => {
    const total = PorcentajeDeAdelanto.crear('100');

    expect(total.adelantoDe(precio('49.90')).enSoles()).toBe('49.90');
  });

  it('nunca pide menos de un céntimo', () => {
    const minimo = PorcentajeDeAdelanto.crear('1');

    expect(minimo.adelantoDe(precio('0.01')).enSoles()).toBe('0.01');
  });

  it('compara por valor', () => {
    expect(
      PorcentajeDeAdelanto.crear('50').igualA(PorcentajeDeAdelanto.crear('50')),
    ).toBe(true);
    expect(
      PorcentajeDeAdelanto.crear('50').igualA(PorcentajeDeAdelanto.crear('40')),
    ).toBe(false);
  });
});
