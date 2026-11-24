import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import {
  type DatosDelFiltro,
  leerFiltroDelHistorial,
} from './filtro-del-historial';

function errores(datos: DatosDelFiltro): Record<string, string> {
  try {
    leerFiltroDelHistorial(datos);
  } catch (error) {
    if (error instanceof ReglaInvalidaError) return error.errores;
    throw error;
  }
  throw new Error('Se esperaba un error de validación.');
}

describe('leerFiltroDelHistorial', () => {
  it('sin datos: todo el historial, lo más reciente primero, 25 por página', () => {
    expect(leerFiltroDelHistorial({})).toEqual({
      soloImportantes: false,
      orden: 'RECIENTES',
      pagina: 1,
      porPagina: 25,
    });
  });

  it('combina quién, categoría, acción, fechas de Lima, importancia y orden', () => {
    const filtro = leerFiltroDelHistorial({
      autor: '7',
      categoria: 'TARIFAS',
      accion: 'EDICION',
      desde: '2026-11-20',
      hasta: '2026-11-24',
      soloImportantes: 'true',
      orden: 'ANTIGUOS',
      pagina: '2',
      porPagina: '10',
    });

    expect(filtro).toEqual({
      autorId: 7,
      categoria: 'TARIFAS',
      accion: 'EDICION',
      desde: new Date('2026-11-20T05:00:00.000Z'),
      // El día final se incluye completo: hasta el inicio del día siguiente.
      antesDe: new Date('2026-11-25T05:00:00.000Z'),
      soloImportantes: true,
      orden: 'ANTIGUOS',
      pagina: 2,
      porPagina: 10,
    });
  });

  it('el mismo día como inicio y fin filtra ese día', () => {
    const { desde, antesDe } = leerFiltroDelHistorial({
      desde: '2026-11-24',
      hasta: '2026-11-24',
    });

    expect(antesDe!.getTime() - desde!.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('si la fecha final es anterior a la inicial no filtra y dice por qué', () => {
    expect(errores({ desde: '2026-11-24', hasta: '2026-11-20' })).toEqual({
      hasta:
        'La fecha final es anterior a la inicial: elige una fecha desde el 24/11/2026.',
    });
  });

  it('informa a la vez cada dato inválido', () => {
    expect(
      errores({
        autor: 'x',
        categoria: 'PAGOS',
        accion: 'BORRADO',
        desde: '2026-02-30',
        orden: 'AL_AZAR',
        pagina: '0',
        porPagina: '1000',
      }),
    ).toEqual({
      autor: 'Elige una persona de la lista.',
      categoria: 'Elige una categoría de la lista.',
      accion: 'Elige una acción de la lista.',
      desde: 'Ingresa una fecha válida.',
      orden: 'Elige más recientes o más antiguos.',
      pagina: 'Elige una página del 1 al 100000.',
      porPagina: 'Muestra 10, 25 o 50 registros por página.',
    });
  });

  it('rechaza una persona o una página fuera de rango', () => {
    expect(errores({ autor: '99999999999', pagina: '100001' })).toEqual({
      autor: 'Elige una persona de la lista.',
      pagina: 'Elige una página del 1 al 100000.',
    });
  });

  it('acepta valores vacíos como si no se hubieran enviado', () => {
    expect(
      leerFiltroDelHistorial({
        autor: '',
        categoria: '',
        desde: '',
        hasta: '',
      }),
    ).toEqual(leerFiltroDelHistorial({}));
  });
});
