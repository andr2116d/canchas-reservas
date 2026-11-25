import { enviarJson, type RespuestaDeLaApi } from "@/compartido/api/enviar-json";
import type { HojaParaAtender, Motivo } from "./reclamos";

const ruta = (numero: string, accion: string) => `/api/reclamos/${encodeURIComponent(numero)}/${accion}`;

/** Al abrir la hoja en pantalla: la primera vez pasa a «en atención». */
export function abrirHoja(numero: string): Promise<RespuestaDeLaApi<HojaParaAtender>> {
  return enviarJson(ruta(numero, "apertura"), "POST");
}

export function clasificarHoja(numero: string, motivo: Motivo): Promise<RespuestaDeLaApi<HojaParaAtender>> {
  return enviarJson(ruta(numero, "motivo"), "PUT", { motivo });
}

export function tramitarComoReclamo(numero: string): Promise<RespuestaDeLaApi<HojaParaAtender>> {
  return enviarJson(ruta(numero, "tramite-como-reclamo"), "POST");
}

export function responderHoja(numero: string, respuesta: { texto: string; cartaEnviadaEl?: string }): Promise<RespuestaDeLaApi<HojaParaAtender>> {
  return enviarJson(ruta(numero, "respuesta"), "POST", respuesta);
}
