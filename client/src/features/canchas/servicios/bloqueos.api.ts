import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { Bloqueo, PedidoDeBloqueo, ReservaCruzada } from "./bloqueos";

const RUTA = "/api/bloqueos";

type Fallo = Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

export type ResultadoDelBloqueo =
  | { tipo: "creados"; bloqueos: Bloqueo[]; reservasAfectadas: ReservaCruzada[] }
  | { tipo: "choca-con-reservas"; mensaje: string; reservas: ReservaCruzada[] }
  | { tipo: "choca-con-bloqueos"; mensaje: string; bloqueos: Bloqueo[] }
  | Fallo;

/** Bloquea las canchas pedidas: todas o ninguna. Si choca, dice con qué. */
export async function bloquearCanchas(pedido: PedidoDeBloqueo): Promise<ResultadoDelBloqueo> {
  const respuesta = await enviarJson<{ bloqueos: Bloqueo[]; reservasAfectadas: ReservaCruzada[] }>(RUTA, "POST", pedido);
  if (respuesta.tipo === "aceptado") return { tipo: "creados", ...respuesta.cuerpo };
  const datos = respuesta.tipo === "rechazado" ? respuesta.datos : undefined;
  if (Array.isArray(datos?.reservas)) return { tipo: "choca-con-reservas", mensaje: respuesta.mensaje, reservas: datos.reservas as ReservaCruzada[] };
  if (Array.isArray(datos?.bloqueos)) return { tipo: "choca-con-bloqueos", mensaje: respuesta.mensaje, bloqueos: datos.bloqueos as Bloqueo[] };
  return resultadoDeAccion(respuesta) as Fallo;
}

/** Termina desde ahora un bloqueo en curso. */
export async function liberarBloqueo(id: number): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson(`${RUTA}/${id}/liberacion`, "POST"));
}

/** Quita entero un bloqueo que aún no empieza. */
export async function quitarBloqueo(id: number): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson(`${RUTA}/${id}`, "DELETE"));
}
