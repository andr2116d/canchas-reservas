import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { AdelantoConsultado } from "./adelanto";

/** Adelanto mínimo vigente, sus versiones anteriores y la propuesta para empezar. */
export function consultarAdelanto(): Promise<AdelantoConsultado> {
  return consultarPaginaPrivada("adelanto", "No pudimos cargar el adelanto mínimo.");
}
