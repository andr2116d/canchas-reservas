import { enviarJson } from "./enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "./resultado-de-accion";

/** Guardado de una regla del local con versiones: `cambio` es falso si ya tenía esos mismos valores. */
export type ResultadoDeVersion = { tipo: "guardado"; cambio: boolean } | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/** Guarda una versión nueva con `PUT`: si los valores no cambiaron, el server no la crea. */
export async function guardarVersion(ruta: string, datos: object): Promise<ResultadoDeVersion> {
  const respuesta = await enviarJson<{ cambio: boolean }>(ruta, "PUT", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardado", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}
