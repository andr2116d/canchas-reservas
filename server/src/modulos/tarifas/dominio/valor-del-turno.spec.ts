import { DuracionDelTurno } from './duracion-del-turno.value-object';
import { HoraDelDia } from './hora-del-dia.value-object';
import { Monto } from './monto.value-object';
import { Tarifa } from './tarifa';
import { calcularValorDelTurno } from './valor-del-turno';

const NOCHE = HoraDelDia.crear('18:00');
const futbol7 = new Tarifa(
  'FUTBOL_7',
  Monto.crear('50'),
  Monto.crear('100'),
  DuracionDelTurno.crear('3'),
);

const calcular = (inicio: string, tarifa = futbol7) =>
  calcularValorDelTurno(tarifa, HoraDelDia.crear(inicio), NOCHE);

describe('calcularValorDelTurno', () => {
  it('un turno de día vale la tarifa de día', () => {
    const valor = calcular('08:00');

    expect(valor.total.enSoles()).toBe('50.00');
    expect(valor.tramos).toEqual([
      { franja: 'DIA', desde: '08:00', hasta: '11:00', monto: '50.00' },
    ]);
  });

  it('un turno de noche vale la tarifa de noche', () => {
    expect(calcular('19:00').total.enSoles()).toBe('100.00');
  });

  it('un turno que cruza a la noche se cobra proporcional a cada franja', () => {
    const valor = calcular('17:00');

    expect(valor.total.enSoles()).toBe('83.33');
    expect(valor.tramos).toEqual([
      { franja: 'DIA', desde: '17:00', hasta: '18:00', monto: '16.67' },
      { franja: 'NOCHE', desde: '18:00', hasta: '20:00', monto: '66.66' },
    ]);
  });

  it('el desglose siempre suma el total, aunque haya céntimos que redondear', () => {
    const { total, tramos } = calcular('17:00');

    const suma = tramos.reduce(
      (acumulado, tramo) => acumulado + Math.round(Number(tramo.monto) * 100),
      0,
    );
    expect(suma).toBe(total.centimos);
  });

  it('un turno que termina justo a medianoche es válido', () => {
    expect(calcular('21:00').tramos.at(-1)?.hasta).toBe('24:00');
  });

  it('el turno que termina justo cuando empieza la noche es solo de día', () => {
    expect(calcular('15:00').tramos.map((tramo) => tramo.franja)).toEqual([
      'DIA',
    ]);
  });

  it('día y noche pueden valer lo mismo', () => {
    const igual = new Tarifa(
      'FUTBOL_5',
      Monto.crear('40'),
      Monto.crear('40'),
      DuracionDelTurno.crear('1'),
    );

    expect(calcular('17:30', igual).total.enSoles()).toBe('40.00');
  });

  it('no deja que el turno pase la medianoche', () => {
    expect(() => calcular('22:00')).toThrow(
      'El turno debe terminar antes de la medianoche.',
    );
  });
});
