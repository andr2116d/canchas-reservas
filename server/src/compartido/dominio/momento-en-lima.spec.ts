import { ValorInvalidoError } from './valor-invalido.error';
import {
  fechaEnLima,
  leerFecha,
  momentoEnLima,
  sumarAFecha,
} from './momento-en-lima';

describe('momento en Lima', () => {
  it('convierte una fecha y hora de Lima al instante que corresponde', () => {
    expect(momentoEnLima('2026-11-28', '07:30').toISOString()).toBe(
      '2026-11-28T12:30:00.000Z',
    );
  });

  it('las 24:00 son el inicio del día siguiente', () => {
    expect(momentoEnLima('2026-11-28', '24:00').toISOString()).toBe(
      '2026-11-29T05:00:00.000Z',
    );
  });

  it('da la fecha de Lima de un instante, aunque en UTC ya sea otro día', () => {
    expect(fechaEnLima(new Date('2026-11-29T03:00:00.000Z'))).toBe(
      '2026-11-28',
    );
  });

  it('rechaza fechas con otro formato o que no existen', () => {
    for (const texto of ['28/11/2026', '2026-02-30', '']) {
      expect(() => leerFecha(texto)).toThrow(
        new ValorInvalidoError('Ingresa una fecha válida.'),
      );
    }
  });

  it('suma días y meses; si el mes no tiene ese día, usa el último', () => {
    expect(sumarAFecha('2026-12-31', { dias: 1 })).toBe('2027-01-01');
    expect(sumarAFecha('2027-01-31', { meses: 1 })).toBe('2027-02-28');
    expect(sumarAFecha('2027-01-31', { meses: 2 })).toBe('2027-03-31');
  });
});
