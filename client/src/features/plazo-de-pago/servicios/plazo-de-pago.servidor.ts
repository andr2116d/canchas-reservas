import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { PlazoConsultado } from "./plazo-de-pago";

/** Plazo para pagar vigente, sus versiones anteriores y el que rige por defecto. */
export function consultarPlazo(): Promise<PlazoConsultado> {
  return consultarPaginaPrivada("plazo-de-pago", "No pudimos cargar el plazo para pagar.");
}
