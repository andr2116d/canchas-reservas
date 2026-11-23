import type { RespuestaDeLaApi } from "./enviar-json";

export type ErroresPorCampo = Record<string, string>;

export type ResultadoDeAccion =
  | { tipo: "hecho" }
  | { tipo: "datos-rechazados"; errores: ErroresPorCampo }
  | { tipo: "error"; mensaje: string };

/**
 * Traduce la respuesta de la API: hecho, errores por campo para marcarlos en
 * el formulario o un mensaje general. `renombrar` adapta los nombres de campo
 * del server a los del formulario.
 */
export function resultadoDeAccion<T>(
  respuesta: RespuestaDeLaApi<T>,
  renombrar: (errores: ErroresPorCampo) => ErroresPorCampo = (errores) => errores,
): ResultadoDeAccion {
  if (respuesta.tipo === "aceptado") return { tipo: "hecho" };
  if (respuesta.tipo === "rechazado" && Object.keys(respuesta.errores).length > 0) {
    return { tipo: "datos-rechazados", errores: renombrar(respuesta.errores) };
  }
  return { tipo: "error", mensaje: respuesta.mensaje };
}
