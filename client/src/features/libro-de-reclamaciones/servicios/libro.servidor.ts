import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { ResumenDeHoja, Seguimiento } from "./libro";

/** Las hojas que el jugador registró con su cuenta. */
export function consultarMisHojas(): Promise<ResumenDeHoja[]> {
  return consultarPaginaPrivada("libro-de-reclamaciones/mis-hojas", "No pudimos cargar tus reclamos.");
}

/** Una hoja propia; una ajena o inexistente lleva al 404. */
export function consultarMiHoja(numero: string): Promise<Seguimiento> {
  return consultarPaginaPrivada(`libro-de-reclamaciones/mis-hojas/${encodeURIComponent(numero)}`, "No pudimos cargar tu reclamo.");
}
