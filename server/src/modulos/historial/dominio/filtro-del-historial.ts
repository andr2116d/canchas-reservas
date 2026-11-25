import {
  elegirDeLista as elegir,
  entero,
  leerPagina,
  leerTamanoDePagina as leerTamano,
  opcional,
  rangoDeDiasDeLima,
} from '../../../compartido/dominio/consulta-paginada';
import { MAXIMO_ID } from '../../../compartido/dominio/id';
import { leerFecha } from '../../../compartido/dominio/momento-en-lima';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import {
  type Accion,
  type Categoria,
  esAccion,
  esCategoria,
} from './categorias-del-historial';

export { TAMANOS_DE_PAGINA } from '../../../compartido/dominio/consulta-paginada';
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

const esOrden = (valor: string): valor is Orden =>
  valor === 'RECIENTES' || valor === 'ANTIGUOS';

const esSiONo = (valor: string): valor is 'true' | 'false' =>
  valor === 'true' || valor === 'false';

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
    pagina: () => opcional(datos.pagina, leerPagina) ?? 1,
    porPagina: () => opcional(datos.porPagina, leerTamano) ?? 25,
    soloImportantes: () =>
      opcional(datos.soloImportantes, (t) =>
        elegir(t, esSiONo, 'Elige ver todos o solo los importantes.'),
      ) === 'true',
  });
  const { autor, categoria, accion, desde, hasta, ...pagina } = leidos;
  return {
    ...(autor !== undefined && { autorId: autor }),
    ...(categoria && { categoria }),
    ...(accion && { accion }),
    ...rangoDeDiasDeLima(desde, hasta),
    ...pagina,
  };
}
