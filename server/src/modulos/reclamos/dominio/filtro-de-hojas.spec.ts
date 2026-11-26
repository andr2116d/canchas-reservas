import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { leerFiltroDeHojas } from './filtro-de-hojas';
import { NumeroDeHoja } from './numero-de-hoja.value-object';

function errores(datos: Parameters<typeof leerFiltroDeHojas>[0]) {
  try {
    leerFiltroDeHojas(datos);
  } catch (error) {
    if (error instanceof ReglaInvalidaError) return error.errores;
    throw error;
  }
  throw new Error('Se esperaba un error.');
}

describe('leerFiltroDeHojas', () => {
  it('sin filtros muestra las que faltan responder, la que vence primero arriba, de 25 en 25', () => {
    expect(leerFiltroDeHojas({})).toEqual({
      estado: 'POR_RESPONDER',
      orden: 'VENCE_PRIMERO',
      pagina: 1,
      porPagina: 25,
    });
  });

  it('lee todos los filtros', () => {
    expect(
      leerFiltroDeHojas({
        estado: 'VENCIDAS',
        tipo: 'QUEJA',
        motivo: 'SIN_MOTIVO',
        numero: '14-2026',
        desde: '2026-11-01',
        hasta: '2026-11-30',
        orden: 'RECIENTES',
        pagina: '2',
        porPagina: '10',
      }),
    ).toEqual({
      estado: 'VENCIDAS',
      tipo: 'QUEJA',
      motivo: 'SIN_MOTIVO',
      numero: NumeroDeHoja.de(2026, 14),
      desde: new Date('2026-11-01T05:00:00.000Z'),
      antesDe: new Date('2026-12-01T05:00:00.000Z'),
      orden: 'RECIENTES',
      pagina: 2,
      porPagina: 10,
    });
  });

  it('dice qué corregir en cada filtro que no existe', () => {
    expect(
      errores({
        estado: 'BORRADAS',
        tipo: 'SUGERENCIA',
        motivo: 'PRECIOS',
        numero: 'abc',
        orden: 'AZAR',
        porPagina: '30',
      }),
    ).toEqual({
      estado: 'Elige un estado de la lista.',
      tipo: 'Elige reclamos o quejas.',
      motivo: 'Elige un motivo de la lista.',
      numero:
        'Ingresa el número de hoja como aparece en la constancia, por ejemplo 000014-2026.',
      orden: 'Elige cómo ordenar la lista.',
      porPagina: 'Muestra 10, 25 o 50 registros por página.',
    });
  });

  it('una fecha final anterior a la inicial no filtra y dice por qué', () => {
    expect(errores({ desde: '2026-11-10', hasta: '2026-11-01' })).toEqual({
      hasta:
        'La fecha final es anterior a la inicial: elige una fecha desde el 10/11/2026.',
    });
  });
});
