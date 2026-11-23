import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { DiaDeLaSemana } from "@/compartido/horario/horario";
import type { DatosDeTarifa } from "../esquemas/tarifa.schema";
import type { TipoDeCancha, TurnosConsultados } from "./tarifas";

const RUTA = "/api/tarifas";

export type ResultadoDeGuardado =
  | { tipo: "guardada"; cambio: boolean }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

export type ResultadoDeLaConsulta =
  | { tipo: "consultado"; turnos: TurnosConsultados }
  | { tipo: "error"; mensaje: string };

/** Guarda la tarifa del tipo; `cambio` es falso si ya tenía esos mismos valores. */
export async function guardarTarifa(tipo: TipoDeCancha, datos: DatosDeTarifa): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>(`${RUTA}/${tipo}`, "PUT", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardada", cambio: respuesta.cuerpo.cambio };
  return resultadoDeAccion(respuesta) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}

/** Turnos del tipo de cancha en un día de la semana, cada uno con su precio. */
export async function consultarTurnosDelDia(tipo: TipoDeCancha, dia: DiaDeLaSemana): Promise<ResultadoDeLaConsulta> {
  const consulta = new URLSearchParams({ tipo, dia });
  const respuesta = await enviarJson<TurnosConsultados>(`${RUTA}/turnos?${consulta}`, "GET");
  if (respuesta.tipo === "aceptado") return { tipo: "consultado", turnos: respuesta.cuerpo };
  return { tipo: "error", mensaje: respuesta.mensaje };
}
