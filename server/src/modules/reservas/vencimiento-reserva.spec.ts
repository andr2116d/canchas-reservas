import { calcularVenceEn, minutosParaPagar } from './vencimiento-reserva';

const INICIO = new Date('2026-10-20T23:00:00.000Z');

describe('vencimiento de la reserva', () => {
  it('vence al cumplirse el tiempo límite si el turno empieza después', () => {
    const creadoEn = new Date('2026-10-20T15:00:00.000Z');
    expect(calcularVenceEn(creadoEn, 15, INICIO)).toEqual(
      new Date('2026-10-20T15:15:00.000Z'),
    );
    expect(minutosParaPagar(creadoEn, 15, INICIO)).toBe(15);
  });

  it('vence en el inicio del turno si empieza antes del límite', () => {
    const creadoEn = new Date('2026-10-20T22:50:00.000Z');
    expect(calcularVenceEn(creadoEn, 15, INICIO)).toEqual(INICIO);
    expect(minutosParaPagar(creadoEn, 15, INICIO)).toBe(10);
  });

  it('si el límite coincide con el inicio vence en el inicio', () => {
    const creadoEn = new Date('2026-10-20T22:45:00.000Z');
    expect(calcularVenceEn(creadoEn, 15, INICIO)).toEqual(INICIO);
  });

  it('redondea hacia abajo los minutos incompletos', () => {
    const creadoEn = new Date('2026-10-20T22:50:30.000Z');
    expect(minutosParaPagar(creadoEn, 15, INICIO)).toBe(9);
  });
});
