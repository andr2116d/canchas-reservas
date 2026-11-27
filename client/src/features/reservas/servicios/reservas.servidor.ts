import { consultarPaginaPrivada } from "@/compartido/sesion/consultar-pagina-privada";
import type { MiReserva } from "./reservas";

/** Una reserva propia; una ajena o inexistente lleva al 404. */
export function consultarMiReserva(codigo: string): Promise<MiReserva> {
  return consultarPaginaPrivada(`reservas/${encodeURIComponent(codigo)}`, "No pudimos cargar tu reserva.");
}
