import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { DuracionDelTurno } from './duracion-del-turno.value-object';
import { Monto } from './monto.value-object';
import { Tarifa } from './tarifa';
import { calcularValorDelTurno } from './valor-del-turno';

const NOCHE = HoraDelDia.crear('18:00');

function unaTarifa(dia: string, noche: string, horas: string) {
  return new Tarifa({
    tipo: 'FUTBOL_7',
    precioDia: Monto.crear(dia),
    precioNoche: Monto.crear(noche),
    duracion: DuracionDelTurno.crear(horas),
    ofreceTurnoCorto: false,
  });
}

const futbol7 = unaTarifa('50', '100', '3');
const enMinutos = (hora: string) => HoraDelDia.crear(hora).minutos;
const turno = (desde: string, hasta: string) => ({
  desde: enMinutos(desde),
  hasta: hasta === '24:00' ? 1440 : enMinutos(hasta),
});
const calcular = (desde: string, hasta: string, tarifa = futbol7) =>
  calcularValorDelTurno(tarifa, turno(desde, hasta), NOCHE);

describe('calcularValorDelTurno', () => {
  it('un turno de día vale la tarifa de día', () => {
    const valor = calcular('08:00', '11:00');

    expect(valor.total.enSoles()).toBe('50.00');
    expect(valor.tramos).toEqual([
      { franja: 'DIA', desde: '08:00', hasta: '11:00', monto: '50.00' },
    ]);
  });

  it('un turno de noche vale la tarifa de noche', () => {
    expect(calcular('19:00', '22:00').total.enSoles()).toBe('100.00');
  });

  it('un turno que cruza a la noche se cobra proporcional a cada franja', () => {
    const valor = calcular('17:00', '20:00');

    expect(valor.total.enSoles()).toBe('83.33');
    expect(valor.tramos).toEqual([
      { franja: 'DIA', desde: '17:00', hasta: '18:00', monto: '16.67' },
      { franja: 'NOCHE', desde: '18:00', hasta: '20:00', monto: '66.66' },
    ]);
  });

  it('el desglose siempre suma el total, aunque haya céntimos que redondear', () => {
    const { total, tramos } = calcular('17:00', '20:00');

    const suma = tramos.reduce(
      (acumulado, tramo) => acumulado + Math.round(Number(tramo.monto) * 100),
      0,
    );
    expect(suma).toBe(total.centimos);
  });

  it('el turno que termina justo cuando empieza la noche es solo de día', () => {
    expect(
      calcular('15:00', '18:00').tramos.map((tramo) => tramo.franja),
    ).toEqual(['DIA']);
  });

  it('un turno corto se cobra en proporción a lo que dura', () => {
    expect(calcular('20:00', '22:00').total.enSoles()).toBe('66.67');
    expect(calcular('22:00', '24:00').tramos.at(-1)?.hasta).toBe('24:00');
  });

  it('día y noche pueden valer lo mismo', () => {
    const igual = unaTarifa('40', '40', '1');

    expect(calcular('17:30', '18:30', igual).total.enSoles()).toBe('40.00');
  });
});
