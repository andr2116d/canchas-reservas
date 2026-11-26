import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { HojaParaAtender, PaginaDeHojas } from "./reclamos";

/** Una página de la lista con los filtros ya revisados. */
export function consultarHojas(consulta: URLSearchParams): Promise<PaginaDeHojas> {
  return consultarPaginaPrivada(`reclamos?${consulta.toString()}`, "No pudimos cargar los reclamos.");
}

/** Una hoja completa; una que no existe lleva al 404. */
export function consultarHoja(numero: string): Promise<HojaParaAtender> {
  return consultarPaginaPrivada(`reclamos/${encodeURIComponent(numero)}`, "No pudimos cargar la hoja.");
}
