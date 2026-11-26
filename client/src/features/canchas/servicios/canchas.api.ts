import { enviarJson, type RespuestaDeLaApi } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { Cancha, DatosDeCancha, ReservaAfectada } from "./canchas";

const RUTA = "/api/canchas";

type Fallo = Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/** Las reservas por jugar impiden el cambio; se muestran para resolverlo. */
export type Bloqueo = { tipo: "bloqueada"; mensaje: string; reservas: ReservaAfectada[] };

export type ResultadoDelAlta = { tipo: "creadas"; canchas: Cancha[] } | Fallo;
export type ResultadoDeLaEdicion = { tipo: "guardada"; cancha: Cancha } | Bloqueo | Fallo;
export type ResultadoDelEstado = { tipo: "hecho" } | Bloqueo | Fallo;

function bloqueoOFallo<T>(respuesta: Exclude<RespuestaDeLaApi<T>, { tipo: "aceptado" }>): Bloqueo | Fallo {
  const reservas = respuesta.tipo === "rechazado" ? respuesta.datos?.reservas : undefined;
  if (Array.isArray(reservas) && reservas.length > 0) {
    return { tipo: "bloqueada", mensaje: respuesta.mensaje, reservas: reservas as ReservaAfectada[] };
  }
  return resultadoDeAccion(respuesta) as Fallo;
}

/** Crea una o varias canchas a la vez: todas o ninguna. */
export async function registrarCanchas(canchas: DatosDeCancha[]): Promise<ResultadoDelAlta> {
  const respuesta = await enviarJson<Cancha[]>(RUTA, "POST", { canchas });
  if (respuesta.tipo === "aceptado") return { tipo: "creadas", canchas: respuesta.cuerpo };
  return resultadoDeAccion(respuesta) as Fallo;
}

export async function editarCancha(id: number, datos: DatosDeCancha): Promise<ResultadoDeLaEdicion> {
  const respuesta = await enviarJson<Cancha>(`${RUTA}/${id}`, "PUT", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardada", cancha: respuesta.cuerpo };
  return bloqueoOFallo(respuesta);
}

async function cambiarEstado(ruta: string, metodo: "POST" | "DELETE"): Promise<ResultadoDelEstado> {
  const respuesta = await enviarJson(ruta, metodo);
  if (respuesta.tipo === "aceptado") return { tipo: "hecho" };
  return bloqueoOFallo(respuesta);
}

export const desactivarCancha = (id: number) => cambiarEstado(`${RUTA}/${id}/desactivacion`, "POST");
export const reactivarCancha = (id: number) => cambiarEstado(`${RUTA}/${id}/reactivacion`, "POST");
export const eliminarCancha = (id: number) => cambiarEstado(`${RUTA}/${id}`, "DELETE");
