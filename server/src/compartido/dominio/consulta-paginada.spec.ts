import { ReglaInvalidaError } from './dominio.error';
import {
  leerPagina,
  leerTamanoDePagina,
  opcional,
  rangoDeDiasDeLima,
} from './consulta-paginada';

describe('consulta paginada', () => {
  it('un filtro vacío no filtra', () => {
    expect(opcional('  ', Number)).toBeUndefined();
    expect(opcional(' 7 ', Number)).toBe(7);
  });

  it('acepta páginas de 10, 25 o 50 registros', () => {
    expect(leerTamanoDePagina('25')).toBe(25);
    expect(() => leerTamanoDePagina('30')).toThrow(
      'Muestra 10, 25 o 50 registros por página.',
    );
  });

  it('rechaza páginas fuera de rango sin llegar a la base', () => {
    expect(leerPagina('3')).toBe(3);
    expect(() => leerPagina('0')).toThrow();
    expect(() => leerPagina('99999999999')).toThrow();
  });

  it('el rango de días de Lima incluye el último día completo', () => {
    expect(rangoDeDiasDeLima('2026-11-01', '2026-11-30')).toEqual({
      desde: new Date('2026-11-01T05:00:00.000Z'),
      antesDe: new Date('2026-12-01T05:00:00.000Z'),
    });
  });

  it('una fecha final anterior a la inicial se rechaza en el campo hasta', () => {
    expect(() => rangoDeDiasDeLima('2026-11-10', '2026-11-01')).toThrow(
      new ReglaInvalidaError({
        hasta:
          'La fecha final es anterior a la inicial: elige una fecha desde el 10/11/2026.',
      }),
    );
  });
});
