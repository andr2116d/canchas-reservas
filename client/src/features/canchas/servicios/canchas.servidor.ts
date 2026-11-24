import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { CambioDeCancha, Cancha } from "./canchas";

/** Canchas del local, consultadas con la sesión de quien abre la página. */
export function consultarCanchas(): Promise<Cancha[]> {
  return consultarPaginaPrivada("canchas", "No pudimos cargar las canchas.");
}

/** Cambios recientes de las canchas, el más reciente primero. */
export function consultarCambiosDeCanchas(): Promise<CambioDeCancha[]> {
  return consultarPaginaPrivada("canchas/cambios", "No pudimos cargar los cambios de las canchas.");
}
