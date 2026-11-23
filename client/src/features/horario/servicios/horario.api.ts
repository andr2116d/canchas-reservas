import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import { type DatosDelFormularioDeHorario } from "../esquemas/horario.schema";
import { datosParaGuardar, erroresDelFormulario } from "../utilidades/datos-del-horario";

export type ResultadoDeGuardado =
  | { tipo: "guardado"; cambio: boolean }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/** Guarda el horario de la semana; `cambio` es falso si ya era el mismo. */
export async function guardarHorario(datos: DatosDelFormularioDeHorario): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>("/api/horario", "PUT", datosParaGuardar(datos));
  if (respuesta.tipo === "aceptado") return { tipo: "guardado", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta, erroresDelFormulario) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}
