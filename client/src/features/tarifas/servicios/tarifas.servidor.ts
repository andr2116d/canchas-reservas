import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { TarifasVigentes } from "./tarifas";

/** Tarifas vigentes de cada tipo, su historial y desde qué hora rige la de noche. */
export function consultarTarifas(): Promise<TarifasVigentes> {
  return consultarPaginaPrivada("tarifas", "No pudimos cargar las tarifas.");
}
