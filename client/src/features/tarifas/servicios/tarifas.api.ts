import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { DatosDeTarifa } from "../esquemas/tarifa.schema";
import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

const RUTA = "/api/tarifas";

export type ResultadoDeGuardado =
  | { tipo: "guardada"; cambio: boolean }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/** Guarda la tarifa del tipo; `cambio` es falso si ya tenía esos mismos valores. */
export async function guardarTarifa(tipo: TipoDeCancha, datos: DatosDeTarifa): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>(`${RUTA}/${tipo}`, "PUT", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardada", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}
