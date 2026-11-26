import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { Autor, PaginaDelHistorial } from "./historial";

/** Una página del historial con los filtros ya revisados, con la sesión de quien abre la página. */
export function consultarHistorial(consulta: URLSearchParams): Promise<PaginaDelHistorial> {
  return consultarPaginaPrivada(`historial?${consulta.toString()}`, "No pudimos cargar el historial de cambios.");
}

/** Quienes tienen registros, para el filtro por persona. */
export function consultarAutores(): Promise<Autor[]> {
  return consultarPaginaPrivada("historial/autores", "No pudimos cargar quiénes hicieron cambios.");
}
