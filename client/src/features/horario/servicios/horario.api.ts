import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { datosParaGuardar } from "../utilidades/datos-del-horario";

export type ResultadoDeGuardado =
  | { tipo: "guardado"; cambio: boolean }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/** Guarda el horario de la semana; `cambio` es falso si ya era el mismo. */
export async function guardarHorario(datos: ReturnType<typeof datosParaGuardar>): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>("/api/horario", "PUT", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardado", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}
