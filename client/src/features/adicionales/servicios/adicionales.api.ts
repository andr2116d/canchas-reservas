import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { Adicional, DatosDeAdicional } from "./adicionales";

const RUTA = "/api/adicionales";

type Fallo = Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

export type ResultadoDelGuardado = { tipo: "guardado"; adicional: Adicional } | Fallo;

async function guardar(ruta: string, metodo: "POST" | "PUT", datos: DatosDeAdicional): Promise<ResultadoDelGuardado> {
  const respuesta = await enviarJson<Adicional>(ruta, metodo, datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardado", adicional: respuesta.cuerpo };
  return resultadoDeAccion(respuesta) as Fallo;
}

export const registrarAdicional = (datos: DatosDeAdicional) => guardar(RUTA, "POST", datos);
export const editarAdicional = (id: number, datos: DatosDeAdicional) => guardar(`${RUTA}/${id}`, "PUT", datos);

async function cambiarEstado(ruta: string, metodo: "POST" | "DELETE"): Promise<ResultadoDeAccion> {
  return resultadoDeAccion(await enviarJson(ruta, metodo));
}

export const desactivarAdicional = (id: number) => cambiarEstado(`${RUTA}/${id}/desactivacion`, "POST");
export const reactivarAdicional = (id: number) => cambiarEstado(`${RUTA}/${id}/reactivacion`, "POST");
export const eliminarAdicional = (id: number) => cambiarEstado(`${RUTA}/${id}`, "DELETE");
