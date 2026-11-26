import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { DatosDeLaRegla } from "../esquemas/regla.schema";
import type { Compensacion } from "./cancelacion";

export type ResultadoDeGuardado =
  | { tipo: "guardada"; cambio: boolean }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

export type ResultadoDeLaSimulacion =
  | { tipo: "simulada"; compensacion: Compensacion }
  | { tipo: "rechazada"; errores: Record<string, string> }
  | { tipo: "error"; mensaje: string };

/** Guarda la regla de cancelación; `cambio` es falso si ya era la misma. */
export async function guardarRegla(datos: DatosDeLaRegla): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>("/api/cancelacion/regla", "PUT", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardada", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}

/** Pide al server lo que recibiría el jugador con la regla en edición, sin guardar nada. */
export async function simularCancelacion(
  datos: DatosDeLaRegla & { anticipo: string; pagado: string; minutosDeAnticipacion: number },
  senal?: AbortSignal,
): Promise<ResultadoDeLaSimulacion> {
  const respuesta = await enviarJson<Compensacion>("/api/cancelacion/simulacion", "POST", datos, senal);
  if (respuesta.tipo === "aceptado") return { tipo: "simulada", compensacion: respuesta.cuerpo };
  if (respuesta.tipo === "rechazado" && Object.keys(respuesta.errores).length > 0) {
    return { tipo: "rechazada", errores: respuesta.errores };
  }
  return { tipo: "error", mensaje: respuesta.mensaje };
}
