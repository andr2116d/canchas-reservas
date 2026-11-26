import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { TarifasVigentes } from "./tarifas";

/** Tarifa vigente de cada tipo de cancha y su historial. */
export function consultarTarifas(): Promise<TarifasVigentes> {
  return consultarPaginaPrivada("tarifas", "No pudimos cargar las tarifas.");
}
