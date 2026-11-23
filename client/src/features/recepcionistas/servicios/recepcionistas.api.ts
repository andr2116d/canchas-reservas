import { enviarJson } from "@/compartido/api/enviar-json";
import {
  type ErroresPorCampo,
  type ResultadoDeAccion,
  resultadoDeAccion,
} from "@/compartido/api/resultado-de-accion";
import type { DatosDeAlta, DatosDeEdicion } from "../esquemas/recepcionista.schema";

const RUTA = "/api/recepcionistas";

export type { ResultadoDeAccion };

export type ResultadoDeAlta =
  | { tipo: "creada"; id: number }
  | { tipo: "reactivable"; id: number; nombres: string }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/** El server nombra `correo` al dato que en el formulario es lo que va antes de la @. */
function erroresDelFormulario({ correo, ...errores }: ErroresPorCampo): ErroresPorCampo {
  return correo ? { ...errores, usuarioDeCorreo: correo } : errores;
}


export async function crearRecepcionista(datos: DatosDeAlta): Promise<ResultadoDeAlta> {
  const respuesta = await enviarJson<{ id: number }>(RUTA, "POST", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "creada", id: respuesta.cuerpo.id };
  const reactivable = respuesta.tipo === "rechazado" ? respuesta.datos?.reactivable : undefined;
  if (reactivable) return { tipo: "reactivable", ...(reactivable as { id: number; nombres: string }) };
  return resultadoDeAccion(respuesta, erroresDelFormulario) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}

async function accion(ruta: string, metodo: "POST" | "PATCH", cuerpo?: unknown): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson(ruta, metodo, cuerpo), erroresDelFormulario);
}

export const editarRecepcionista = (id: number, datos: DatosDeEdicion) => accion(`${RUTA}/${id}`, "PATCH", datos);
export const desactivarRecepcionista = (id: number) => accion(`${RUTA}/${id}/desactivacion`, "POST");
export const reactivarRecepcionista = (id: number, contrasena: string) =>
  accion(`${RUTA}/${id}/reactivacion`, "POST", { contrasena });
export const restablecerContrasena = (id: number, contrasena: string) =>
  accion(`${RUTA}/${id}/restablecimiento-de-contrasena`, "POST", { contrasena });

/** Lo que va antes de la @ de un correo institucional libre, o nada si no se pudo sugerir. */
export async function sugerirCorreo(nombres: string, apellidos: string): Promise<string | undefined> {
  const consulta = new URLSearchParams({ nombres, apellidos });
  try {
    const respuesta = await fetch(`${RUTA}/correo-sugerido?${consulta}`, { cache: "no-store" });
    if (!respuesta.ok) return undefined;
    return ((await respuesta.json()) as { usuarioDeCorreo: string }).usuarioDeCorreo;
  } catch {
    return undefined;
  }
}
