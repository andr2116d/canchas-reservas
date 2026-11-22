import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { FechaNacimiento } from './fecha-nacimiento.value-object';

// 22 de noviembre de 2026 a las 10:00 en Lima (UTC-5).
const HOY = new Date('2026-11-22T15:00:00.000Z');

describe('FechaNacimiento', () => {
  it('acepta a una persona mayor de 18 años', () => {
    expect(FechaNacimiento.crear('1998-05-14', HOY).fecha).toBe('1998-05-14');
  });

  it('acepta a quien cumple 18 años hoy', () => {
    expect(FechaNacimiento.crear('2008-11-22', HOY).fecha).toBe('2008-11-22');
  });

  it('rechaza a quien cumple 18 años mañana', () => {
    expect(() => FechaNacimiento.crear('2008-11-23', HOY)).toThrow(
      new ValorInvalidoError(
        'Debes tener al menos 18 años para crear tu cuenta.',
      ),
    );
  });

  it('cuenta el día según la hora de Lima, no la del servidor', () => {
    // 23 de noviembre a las 02:00 UTC todavía es 22 de noviembre en Lima.
    const nocheEnLima = new Date('2026-11-23T02:00:00.000Z');

    expect(() => FechaNacimiento.crear('2008-11-23', nocheEnLima)).toThrow(
      new ValorInvalidoError(
        'Debes tener al menos 18 años para crear tu cuenta.',
      ),
    );
  });

  it('a quien nació un 29 de febrero le cuenta el cumpleaños desde el 1 de marzo', () => {
    const veintiochoDeFebrero = new Date('2026-02-28T15:00:00.000Z');
    const primeroDeMarzo = new Date('2026-03-01T15:00:00.000Z');

    expect(() =>
      FechaNacimiento.crear('2008-02-29', veintiochoDeFebrero),
    ).toThrow(ValorInvalidoError);
    expect(FechaNacimiento.crear('2008-02-29', primeroDeMarzo).fecha).toBe(
      '2008-02-29',
    );
  });

  it.each([
    ['', 'Ingresa tu fecha de nacimiento.'],
    ['14/05/1998', 'La fecha de nacimiento no es válida.'],
    ['1998-02-30', 'La fecha de nacimiento no es válida.'],
    ['1998-13-01', 'La fecha de nacimiento no es válida.'],
    ['2027-01-01', 'La fecha de nacimiento no puede ser futura.'],
    ['1899-12-31', 'Revisa el año de tu fecha de nacimiento.'],
  ])('rechaza "%s": %s', (fecha, mensaje) => {
    expect(() => FechaNacimiento.crear(fecha, HOY)).toThrow(
      new ValorInvalidoError(mensaje),
    );
  });
});
