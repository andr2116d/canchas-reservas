import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { BloqueosConsultados } from "./bloqueos";

/** Bloqueos en curso y próximos, y los últimos terminados, con la sesión de quien abre la página. */
export function consultarBloqueos(): Promise<BloqueosConsultados> {
  return consultarPaginaPrivada("bloqueos", "No pudimos cargar los bloqueos.");
}
