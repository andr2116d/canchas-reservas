import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import {
  leerFecha,
  momentoEnLima,
  sumarAFecha,
} from '../../../compartido/dominio/momento-en-lima';
import { MAXIMO_ID } from '../../../compartido/dominio/id';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import {
  type Accion,
  type Categoria,
  esAccion,
  esCategoria,
} from './categorias-del-historial';

export const TAMANOS_DE_PAGINA = [10, 25, 50] as const;
export type Orden = 'RECIENTES' | 'ANTIGUOS';

/** Filtros tal como llegan en la consulta; todos opcionales. */
export interface DatosDelFiltro {
  autor?: string;
  categoria?: string;
  accion?: string;
  desde?: string;
  hasta?: string;
  soloImportantes?: string;
  orden?: string;
  pagina?: string;
  porPagina?: string;
}

/** Filtros validados. Las fechas son días de Lima: `antesDe` es el inicio del día siguiente al final. */
export interface FiltroDelHistorial {
  autorId?: number;
  categoria?: Categoria;
  accion?: Accion;
  desde?: Date;
  antesDe?: Date;
  soloImportantes: boolean;
  orden: Orden;
  pagina: number;
  porPagina: number;
}

const vacio = (valor?: string): valor is undefined | '' =>
  valor === undefined || valor.trim() === '';

function opcional<T>(
  valor: string | undefined,
  leer: (texto: string) => T,
): T | undefined {
  return vacio(valor) ? undefined : leer(valor.trim());
}

// Una página más allá de este tope no tendría registros.
const MAXIMA_PAGINA = 100_000;

function entero(texto: string, mensaje: string, maximo: number): number {
  const numero = /^\d{1,10}$/.test(texto) ? Number(texto) : 0;
  if (numero < 1 || numero > maximo) throw new ValorInvalidoError(mensaje);
  return numero;
}

function elegir<T>(
  texto: string,
  esValido: (valor: string) => valor is T & string,
  mensaje: string,
): T {
  if (!esValido(texto)) throw new ValorInvalidoError(mensaje);
  return texto;
}

const esOrden = (valor: string): valor is Orden =>
  valor === 'RECIENTES' || valor === 'ANTIGUOS';

function leerTamano(texto: string): number {
  const tamano = Number(texto);
  if (!(TAMANOS_DE_PAGINA as readonly number[]).includes(tamano))
    throw new ValorInvalidoError('Muestra 10, 25 o 50 registros por página.');
  return tamano;
}

const enTextoDePeru = (fecha: string) => fecha.split('-').reverse().join('/');

/** Lee y valida los filtros; un rango con el final antes del inicio se rechaza con su motivo. */
export function leerFiltroDelHistorial(
  datos: DatosDelFiltro,
): FiltroDelHistorial {
  const leidos = validarCampos({
    autor: () =>
      opcional(datos.autor, (t) =>
        entero(t, 'Elige una persona de la lista.', MAXIMO_ID),
      ),
    categoria: () =>
      opcional(datos.categoria, (t) =>
        elegir(t, esCategoria, 'Elige una categoría de la lista.'),
      ),
    accion: () =>
      opcional(datos.accion, (t) =>
        elegir(t, esAccion, 'Elige una acción de la lista.'),
      ),
    desde: () => opcional(datos.desde, leerFecha),
    hasta: () => opcional(datos.hasta, leerFecha),
    orden: () =>
      opcional(datos.orden, (t) =>
        elegir(t, esOrden, 'Elige más recientes o más antiguos.'),
      ) ?? 'RECIENTES',
    pagina: () =>
      opcional(datos.pagina, (t) =>
        entero(t, `Elige una página del 1 al ${MAXIMA_PAGINA}.`, MAXIMA_PAGINA),
      ) ?? 1,
    porPagina: () => opcional(datos.porPagina, leerTamano) ?? 25,
  });
  const { autor, categoria, accion, desde, hasta, ...pagina } = leidos;
  if (desde && hasta && hasta < desde)
    throw new ReglaInvalidaError({
      hasta: `La fecha final es anterior a la inicial: elige una fecha desde el ${enTextoDePeru(desde)}.`,
    });
  return {
    ...(autor !== undefined && { autorId: autor }),
    ...(categoria && { categoria }),
    ...(accion && { accion }),
    ...(desde && { desde: momentoEnLima(desde, '00:00') }),
    ...(hasta && {
      antesDe: momentoEnLima(sumarAFecha(hasta, { dias: 1 }), '00:00'),
    }),
    soloImportantes: datos.soloImportantes === 'true',
    ...pagina,
  };
}
