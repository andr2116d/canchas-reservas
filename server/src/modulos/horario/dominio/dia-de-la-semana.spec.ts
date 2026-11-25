import { diaDeLaSemanaDe } from './dia-de-la-semana';

describe('diaDeLaSemanaDe', () => {
  it.each([
    ['2026-11-23', 'LUNES'],
    ['2026-11-24', 'MARTES'],
    ['2026-11-28', 'SABADO'],
    ['2026-11-29', 'DOMINGO'],
    ['2027-01-01', 'VIERNES'],
  ])('%s es %s', (fecha, dia) => {
    expect(diaDeLaSemanaDe(fecha)).toBe(dia);
  });
});
