import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { Adicional, CambioDeAdicional } from "./adicionales";

/** Catálogo de adicionales, consultado con la sesión de quien abre la página. */
export function consultarAdicionales(): Promise<Adicional[]> {
  return consultarPaginaPrivada("adicionales", "No pudimos cargar los adicionales.");
}

/** Cambios recientes del catálogo, el más reciente primero. */
export function consultarCambiosDeAdicionales(): Promise<CambioDeAdicional[]> {
  return consultarPaginaPrivada("adicionales/cambios", "No pudimos cargar los cambios de los adicionales.");
}
