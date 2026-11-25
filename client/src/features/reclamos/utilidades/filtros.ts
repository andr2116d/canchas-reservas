import { ESTADOS_DEL_FILTRO, type EstadoDelFiltro, type Motivo, NOMBRE_DEL_MOTIVO, type TipoDeHoja } from "../servicios/reclamos";

export const TAMANOS_DE_PAGINA = [10, 25, 50] as const;
export const PERIODOS = { TODO: "Todo", "7": "Últimos 7 días", "30": "Últimos 30 días" } as const;
export const ORDENES = { VENCE_PRIMERO: "Vence primero", RECIENTES: "Más recientes", ANTIGUAS: "Más antiguas" } as const;

export interface FiltrosDeReclamos {
  estado: EstadoDelFiltro;
  tipo?: TipoDeHoja;
  motivo?: Motivo | "SIN_MOTIVO";
  numero?: string;
  periodo: keyof typeof PERIODOS;
  orden: keyof typeof ORDENES;
  pagina: number;
  porPagina: number;
}

type Parametros = Record<string, string | string[] | undefined>;

const uno = (valor: string | string[] | undefined) => (typeof valor === "string" ? valor : undefined);
const de = <T extends string>(valor: string | undefined, opciones: readonly T[]): T | undefined => opciones.find((o) => o === valor);

/** Lee la dirección con los mismos topes que la API; lo inválido se ignora y vuelve a su valor por defecto. */
export function leerFiltros(parametros: Parametros): FiltrosDeReclamos {
  const pagina = Number(uno(parametros.pagina));
  const porPagina = Number(uno(parametros.porPagina));
  const numero = uno(parametros.numero)?.trim();
  return {
    estado: de(uno(parametros.estado), ESTADOS_DEL_FILTRO) ?? "POR_RESPONDER",
    tipo: de(uno(parametros.tipo), ["RECLAMO", "QUEJA"] as const),
    motivo: de(uno(parametros.motivo), [...(Object.keys(NOMBRE_DEL_MOTIVO) as Motivo[]), "SIN_MOTIVO" as const]),
    numero: numero && /^\d{1,6}-\d{4}$/.test(numero) ? numero : undefined,
    periodo: de(uno(parametros.periodo), Object.keys(PERIODOS) as (keyof typeof PERIODOS)[]) ?? "TODO",
    orden: de(uno(parametros.orden), Object.keys(ORDENES) as (keyof typeof ORDENES)[]) ?? "VENCE_PRIMERO",
    pagina: Number.isInteger(pagina) && pagina >= 1 && pagina <= 100_000 ? pagina : 1,
    porPagina: (TAMANOS_DE_PAGINA as readonly number[]).includes(porPagina) ? porPagina : 25,
  };
}

const restarDias = (fecha: string, dias: number) => {
  const momento = new Date(`${fecha}T12:00:00.000Z`);
  momento.setUTCDate(momento.getUTCDate() - dias);
  return momento.toISOString().slice(0, 10);
};

/** La consulta para la API: el período se vuelve una fecha de inicio contada desde hoy en Lima. */
export function aConsulta(filtros: FiltrosDeReclamos, hoy: string): URLSearchParams {
  const consulta = new URLSearchParams({ estado: filtros.estado, orden: filtros.orden, pagina: String(filtros.pagina), porPagina: String(filtros.porPagina) });
  if (filtros.tipo) consulta.set("tipo", filtros.tipo);
  if (filtros.motivo) consulta.set("motivo", filtros.motivo);
  if (filtros.numero) consulta.set("numero", filtros.numero);
  if (filtros.periodo !== "TODO") consulta.set("desde", restarDias(hoy, Number(filtros.periodo) - 1));
  return consulta;
}

const POR_DEFECTO: Partial<Record<keyof FiltrosDeReclamos, string>> = { estado: "POR_RESPONDER", periodo: "TODO", orden: "VENCE_PRIMERO", pagina: "1", porPagina: "25" };

/** La dirección de la lista con estos filtros, sin los valores por defecto. */
export function aDireccion(filtros: FiltrosDeReclamos): string {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && String(valor) !== POR_DEFECTO[clave as keyof FiltrosDeReclamos]) parametros.set(clave, String(valor));
  }
  const texto = parametros.toString();
  return `/administracion/reclamos${texto ? `?${texto}` : ""}`;
}
