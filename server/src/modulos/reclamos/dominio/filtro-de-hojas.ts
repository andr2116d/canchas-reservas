import {
  leerPagina,
  leerTamanoDePagina,
  opcional,
  rangoDeDiasDeLima,
} from '../../../compartido/dominio/consulta-paginada';
import { leerFecha } from '../../../compartido/dominio/momento-en-lima';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { NumeroDeHoja } from './numero-de-hoja.value-object';
import {
  elegir,
  type Motivo,
  MOTIVOS,
  TIPOS_DE_HOJA,
  type TipoDeHoja,
} from './opciones-de-la-hoja';

/** «Por responder» junta nuevas y en atención; «vencidas» son las por responder con el plazo pasado. */
export const ESTADOS_DEL_FILTRO = [
  'POR_RESPONDER',
  'NUEVA',
  'EN_ATENCION',
  'VENCIDAS',
  'RESPONDIDA',
  'TODAS',
] as const;
export type EstadoDelFiltro = (typeof ESTADOS_DEL_FILTRO)[number];

export const ORDENES_DE_HOJAS = [
  'VENCE_PRIMERO',
  'RECIENTES',
  'ANTIGUAS',
] as const;
export type OrdenDeHojas = (typeof ORDENES_DE_HOJAS)[number];

const MOTIVOS_DEL_FILTRO = [...MOTIVOS, 'SIN_MOTIVO'] as const;

/** Filtros tal como llegan en la consulta; todos opcionales. */
export interface DatosDelFiltroDeHojas {
  estado?: string;
  tipo?: string;
  motivo?: string;
  numero?: string;
  desde?: string;
  hasta?: string;
  orden?: string;
  pagina?: string;
  porPagina?: string;
}

export interface FiltroDeHojas {
  estado: EstadoDelFiltro;
  tipo?: TipoDeHoja;
  motivo?: Motivo | 'SIN_MOTIVO';
  numero?: NumeroDeHoja;
  desde?: Date;
  antesDe?: Date;
  orden: OrdenDeHojas;
  pagina: number;
  porPagina: number;
}

/** Lee y valida los filtros de la lista de administración. */
export function leerFiltroDeHojas(datos: DatosDelFiltroDeHojas): FiltroDeHojas {
  const leidos = validarCampos({
    estado: () =>
      opcional(datos.estado, (t) =>
        elegir(t, ESTADOS_DEL_FILTRO, 'Elige un estado de la lista.'),
      ) ?? 'POR_RESPONDER',
    tipo: () =>
      opcional(datos.tipo, (t) =>
        elegir(t, TIPOS_DE_HOJA, 'Elige reclamos o quejas.'),
      ),
    motivo: () =>
      opcional(datos.motivo, (t) =>
        elegir(t, MOTIVOS_DEL_FILTRO, 'Elige un motivo de la lista.'),
      ),
    numero: () => opcional(datos.numero, (t) => NumeroDeHoja.leer(t)),
    desde: () => opcional(datos.desde, leerFecha),
    hasta: () => opcional(datos.hasta, leerFecha),
    orden: () =>
      opcional(datos.orden, (t) =>
        elegir(t, ORDENES_DE_HOJAS, 'Elige cómo ordenar la lista.'),
      ) ?? 'VENCE_PRIMERO',
    pagina: () => opcional(datos.pagina, leerPagina) ?? 1,
    porPagina: () => opcional(datos.porPagina, leerTamanoDePagina) ?? 25,
  });
  const { tipo, motivo, numero, desde, hasta, ...resto } = leidos;
  return {
    estado: resto.estado,
    ...(tipo && { tipo }),
    ...(motivo && { motivo }),
    ...(numero && { numero }),
    ...rangoDeDiasDeLima(desde, hasta),
    orden: resto.orden,
    pagina: resto.pagina,
    porPagina: resto.porPagina,
  };
}
