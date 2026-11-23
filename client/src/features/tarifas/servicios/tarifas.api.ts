import { enviarJson } from "@/compartido/api/enviar-json";
import {
  type ResultadoDeAccion,
  resultadoDeAccion,
} from "@/compartido/api/resultado-de-accion";
import type { DatosDeTarifa } from "../esquemas/tarifa.schema";
import type { TipoDeCancha, ValorCalculado } from "./tarifas";

const RUTA = "/api/tarifas";

export type ResultadoDeGuardado =
  | { tipo: "guardada"; cambio: boolean }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

export type ResultadoDelCalculo =
  | { tipo: "calculado"; valor: ValorCalculado }
  | { tipo: "error"; mensaje: string };

/** Guarda la tarifa del tipo; `cambio` es falso si ya tenía esos mismos valores. */
export async function guardarTarifa(
  tipo: TipoDeCancha,
  datos: DatosDeTarifa,
): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>(
    `${RUTA}/${tipo}`,
    "PUT",
    datos,
  );
  if (respuesta.tipo === "aceptado")
    return { tipo: "guardada", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta) as Exclude<
    ResultadoDeAccion,
    { tipo: "hecho" }
  >;
}

/** Valor del turno del tipo que empieza a esa hora, con su desglose por franja. */
export async function calcularValorDelTurno(
  tipo: TipoDeCancha,
  inicio: string,
): Promise<ResultadoDelCalculo> {
  const consulta = new URLSearchParams({ tipo, inicio });
  const respuesta = await enviarJson<ValorCalculado>(
    `${RUTA}/valor-del-turno?${consulta}`,
    "GET",
  );
  if (respuesta.tipo === "aceptado")
    return { tipo: "calculado", valor: respuesta.cuerpo };
  if (respuesta.tipo === "rechazado") {
    return {
      tipo: "error",
      mensaje: Object.values(respuesta.errores)[0] ?? respuesta.mensaje,
    };
  }
  return { tipo: "error", mensaje: respuesta.mensaje };
}
