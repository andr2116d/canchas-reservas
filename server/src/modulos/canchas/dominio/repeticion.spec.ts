import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { rangosDelBloqueo } from './repeticion';

const momento = (texto: string) => new Date(`${texto}-05:00`);
const primero = {
  inicio: momento('2027-01-31T07:00:00'),
  fin: momento('2027-01-31T09:00:00'),
};
const fechas = (rangos: { inicio: Date }[]) =>
  rangos.map(({ inicio }) => inicio.toISOString());

describe('rangosDelBloqueo', () => {
  it('sin repetición es un solo rango', () => {
    expect(rangosDelBloqueo(primero)).toEqual([primero]);
  });

  it('cada semana repite a la misma hora hasta la fecha, incluida', () => {
    const rangos = rangosDelBloqueo(primero, {
      frecuencia: 'SEMANAL',
      hasta: '2027-02-14',
    });

    expect(fechas(rangos)).toEqual([
      '2027-01-31T12:00:00.000Z',
      '2027-02-07T12:00:00.000Z',
      '2027-02-14T12:00:00.000Z',
    ]);
    expect(rangos[2].fin.toISOString()).toBe('2027-02-14T14:00:00.000Z');
  });

  it('cada mes usa el mismo día; si el mes no lo tiene, el último', () => {
    const rangos = rangosDelBloqueo(primero, {
      frecuencia: 'MENSUAL',
      hasta: '2027-03-31',
    });

    expect(fechas(rangos)).toEqual([
      '2027-01-31T12:00:00.000Z',
      '2027-02-28T12:00:00.000Z',
      '2027-03-31T12:00:00.000Z',
    ]);
  });

  it('rechaza repetir algo que dura tanto que se pisaría consigo mismo', () => {
    const largo = { ...primero, fin: momento('2027-02-01T08:00:00') };

    expect(() =>
      rangosDelBloqueo(largo, { frecuencia: 'DIARIA', hasta: '2027-02-05' }),
    ).toThrow(
      new ReglaInvalidaError({
        repeticion:
          'Para repetir cada día, el bloqueo debe durar menos de un día.',
      }),
    );
  });

  it('exige que la repetición termine después del primero y no pase de un año', () => {
    expect(() =>
      rangosDelBloqueo(primero, { frecuencia: 'DIARIA', hasta: '2027-01-30' }),
    ).toThrow(
      expect.objectContaining({
        errores: {
          repeticion: 'Elige una fecha final posterior al primer bloqueo.',
        },
      }),
    );
    expect(() =>
      rangosDelBloqueo(primero, { frecuencia: 'DIARIA', hasta: '2028-02-01' }),
    ).toThrow(
      expect.objectContaining({
        errores: { repeticion: 'Repite como máximo por un año.' },
      }),
    );
    expect(() =>
      rangosDelBloqueo(primero, {
        frecuencia: 'CADA_RATO',
        hasta: '2027-02-01',
      }),
    ).toThrow(
      expect.objectContaining({
        errores: { repeticion: 'Elige cada cuánto se repite.' },
      }),
    );
  });
});
