import { sumarDias } from "@/compartido/ui/fecha-en-lima";
import { ACCIONES, ACCIONES_POR_CATEGORIA, type Accion, CATEGORIAS, type Categoria } from "../servicios/historial";

export const TAMANOS_DE_PAGINA = [10, 25, 50] as const;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Filtros del historial tal como los muestra la pantalla; vacío es «todos». */
export interface Filtros {
  autor: string;
  categoria: Categoria | "";
  accion: Accion | "";
  desde: string;
  hasta: string;
  soloImportantes: boolean;
  orden: "RECIENTES" | "ANTIGUOS";
  pagina: number;
  porPagina: number;
}

export const FILTROS_INICIALES: Filtros = {
  autor: "",
  categoria: "",
  accion: "",
  desde: "",
  hasta: "",
  soloImportantes: false,
  orden: "RECIENTES",
  pagina: 1,
  porPagina: 25,
};

export const RANGO_INVERTIDO = "La fecha final es anterior a la inicial, así que no se filtró por fechas.";

type Parametros = Record<string, string | string[] | undefined>;

const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor) ?? "";
// Los mismos topes que valida la API: un id es un `integer` de la base y las páginas tienen un máximo.
const MAXIMO_ID = 2_147_483_647;
const MAXIMA_PAGINA = 100_000;

/** Un entero de 1 al máximo dado, o nada si el texto no lo es. */
function entero(texto: string, maximo: number): number | undefined {
  const numero = /^\d{1,10}$/.test(texto) ? Number(texto) : 0;
  return numero >= 1 && numero <= maximo ? numero : undefined;
}

function leerCategoria(texto: string): Categoria | "" {
  return CATEGORIAS.some((c) => c.valor === texto) ? (texto as Categoria) : "";
}

function leerAccion(texto: string, categoria: Categoria | ""): Accion | "" {
  if (!ACCIONES.some((a) => a.valor === texto)) return "";
  if (categoria && !ACCIONES_POR_CATEGORIA[categoria].includes(texto as Accion)) return "";
  return texto as Accion;
}

/** Lee los filtros de la dirección; lo que no es válido se ignora y un rango invertido se avisa. */
export function leerFiltros(parametros: Parametros): { filtros: Filtros; aviso?: string } {
  const categoria = leerCategoria(uno(parametros.categoria));
  const porPagina = entero(uno(parametros.porPagina), 50);
  const desde = FECHA.test(uno(parametros.desde)) ? uno(parametros.desde) : "";
  const hasta = FECHA.test(uno(parametros.hasta)) ? uno(parametros.hasta) : "";
  const invertido = Boolean(desde && hasta && hasta < desde);
  const filtros: Filtros = {
    autor: entero(uno(parametros.autor), MAXIMO_ID) ? uno(parametros.autor) : "",
    categoria,
    accion: leerAccion(uno(parametros.accion), categoria),
    desde: invertido ? "" : desde,
    hasta: invertido ? "" : hasta,
    soloImportantes: uno(parametros.importantes) === "1",
    orden: uno(parametros.orden) === "antiguos" ? "ANTIGUOS" : "RECIENTES",
    pagina: entero(uno(parametros.pagina), MAXIMA_PAGINA) ?? 1,
    porPagina: (TAMANOS_DE_PAGINA as readonly number[]).includes(porPagina ?? 0) ? porPagina! : 25,
  };
  return invertido ? { filtros, aviso: RANGO_INVERTIDO } : { filtros };
}

/** La dirección de la pantalla con estos filtros; se omite lo que vale por defecto. */
export function aDireccion(filtros: Filtros): string {
  const parametros = new URLSearchParams();
  if (filtros.autor) parametros.set("autor", filtros.autor);
  if (filtros.categoria) parametros.set("categoria", filtros.categoria);
  if (filtros.accion) parametros.set("accion", filtros.accion);
  if (filtros.desde) parametros.set("desde", filtros.desde);
  if (filtros.hasta) parametros.set("hasta", filtros.hasta);
  if (filtros.soloImportantes) parametros.set("importantes", "1");
  if (filtros.orden === "ANTIGUOS") parametros.set("orden", "antiguos");
  if (filtros.pagina > 1) parametros.set("pagina", String(filtros.pagina));
  if (filtros.porPagina !== 25) parametros.set("porPagina", String(filtros.porPagina));
  const texto = parametros.toString();
  return texto ? `?${texto}` : "?";
}

/** La consulta a la API: solo lo que filtra, con sus nombres. */
export function aConsulta(filtros: Filtros): URLSearchParams {
  const consulta = new URLSearchParams();
  if (filtros.autor) consulta.set("autor", filtros.autor);
  if (filtros.categoria) consulta.set("categoria", filtros.categoria);
  if (filtros.accion) consulta.set("accion", filtros.accion);
  if (filtros.desde) consulta.set("desde", filtros.desde);
  if (filtros.hasta) consulta.set("hasta", filtros.hasta);
  if (filtros.soloImportantes) consulta.set("soloImportantes", "true");
  if (filtros.orden === "ANTIGUOS") consulta.set("orden", "ANTIGUOS");
  consulta.set("pagina", String(filtros.pagina));
  consulta.set("porPagina", String(filtros.porPagina));
  return consulta;
}

/** Si algo, aparte del orden y la página, está reduciendo la lista. */
export function hayFiltros(filtros: Filtros): boolean {
  return Boolean(filtros.autor || filtros.categoria || filtros.accion || filtros.desde || filtros.hasta || filtros.soloImportantes);
}

export type Periodo = "TODO" | "HOY" | "AYER" | "SIETE_DIAS" | "TREINTA_DIAS";

/** Atajos de fechas, contados en días de Lima e incluyendo hoy. */
export const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: "TODO", texto: "Todo" },
  { valor: "HOY", texto: "Hoy" },
  { valor: "AYER", texto: "Ayer" },
  { valor: "SIETE_DIAS", texto: "7 días" },
  { valor: "TREINTA_DIAS", texto: "30 días" },
];

const restarDias = (fecha: string, dias: number) => sumarDias(fecha, -dias);

/** Desde y hasta de un atajo; «Todo» no filtra por fechas. */
export function rangoDelPeriodo(periodo: Periodo, hoy: string): Pick<Filtros, "desde" | "hasta"> {
  switch (periodo) {
    case "HOY":
      return { desde: hoy, hasta: hoy };
    case "AYER":
      return { desde: restarDias(hoy, 1), hasta: restarDias(hoy, 1) };
    case "SIETE_DIAS":
      return { desde: restarDias(hoy, 6), hasta: hoy };
    case "TREINTA_DIAS":
      return { desde: restarDias(hoy, 29), hasta: hoy };
    default:
      return { desde: "", hasta: "" };
  }
}

/** El atajo que corresponde a las fechas elegidas, o ninguno si son otras. */
export function periodoDe(filtros: Pick<Filtros, "desde" | "hasta">, hoy: string): Periodo | undefined {
  return PERIODOS.find(({ valor }) => {
    const rango = rangoDelPeriodo(valor, hoy);
    return rango.desde === filtros.desde && rango.hasta === filtros.hasta;
  })?.valor;
}
