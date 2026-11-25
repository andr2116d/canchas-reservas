import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { DatosDelAdelanto } from "../esquemas/adelanto.schema";

export type ResultadoDeGuardado =
  | { tipo: "guardado"; cambio: boolean }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/** Guarda el adelanto mínimo; `cambio` es falso si ya tenía ese mismo porcentaje. */
export async function guardarAdelanto(datos: DatosDelAdelanto): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>("/api/adelanto", "PUT", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardado", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}
