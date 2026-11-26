import { Monto } from '../../../compartido/dominio/monto.value-object';
import { calcularCompensacion } from './compensacion';
import { ReglaDeCancelacion } from './regla-de-cancelacion';

const regla = ReglaDeCancelacion.crear([
  { desdeHoras: '2', porcentaje: '100', ofreceCredito: true },
  { desdeHoras: '1', porcentaje: '50', ofreceCredito: false },
  { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
]);
const soles = (texto: string) => Monto.crear(texto);

describe('calcularCompensacion', () => {
  it('con 2 horas o más devuelve todo el anticipo, en dinero o en crédito', () => {
    const resultado = calcularCompensacion(regla, {
      anticipo: soles('50'),
      pagado: soles('50'),
      minutosDeAnticipacion: 180,
    });

    expect(resultado).toEqual({
      desdeHoras: 2,
      porcentaje: 100,
      formas: ['DINERO', 'CREDITO'],
      devolucionDelAnticipo: '50.00',
      retenido: '0.00',
      excedente: '0.00',
      totalADevolver: '50.00',
    });
  });

  it('entre 1 y 2 horas devuelve la mitad del anticipo y retiene el resto', () => {
    const resultado = calcularCompensacion(regla, {
      anticipo: soles('45.25'),
      pagado: soles('45.25'),
      minutosDeAnticipacion: 90,
    });

    expect(resultado).toMatchObject({
      porcentaje: 50,
      formas: ['DINERO'],
      devolucionDelAnticipo: '22.63',
      retenido: '22.62',
    });
  });

  it('con menos de 1 hora retiene el anticipo, pero devuelve lo pagado por encima de él', () => {
    const resultado = calcularCompensacion(regla, {
      anticipo: soles('50'),
      pagado: soles('100'),
      minutosDeAnticipacion: 30,
    });

    expect(resultado).toMatchObject({
      porcentaje: 0,
      formas: [],
      devolucionDelAnticipo: '0.00',
      retenido: '50.00',
      excedente: '50.00',
      totalADevolver: '50.00',
    });
  });

  it('no calcula si lo pagado es menor que el anticipo o la reserva ya empezó', () => {
    expect(() =>
      calcularCompensacion(regla, {
        anticipo: soles('50'),
        pagado: soles('40'),
        minutosDeAnticipacion: 30,
      }),
    ).toThrow('Lo pagado no puede ser menor que el anticipo.');
    expect(() =>
      calcularCompensacion(regla, {
        anticipo: soles('50'),
        pagado: soles('50'),
        minutosDeAnticipacion: -1,
      }),
    ).toThrow('La reserva ya empezó: ya no se puede cancelar.');
  });
});
