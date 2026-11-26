import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { ReglaConsultada } from "./cancelacion";

/** Regla de cancelación vigente, consultada con la sesión de quien abre la página. */
export function consultarRegla(): Promise<ReglaConsultada> {
  return consultarPaginaPrivada("cancelacion/regla", "No pudimos cargar la regla de cancelación.");
}
