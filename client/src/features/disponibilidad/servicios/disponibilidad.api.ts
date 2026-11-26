import { enviarJson } from "@/compartido/api/enviar-json";
import type { MapaDelDia } from "./disponibilidad";

export type ResultadoDelMapa = { tipo: "consultado"; mapa: MapaDelDia } | { tipo: "error"; mensaje: string };

/** Mapa de turnos de un día; sin fecha, el de hoy. No necesita sesión. */
export async function consultarMapa(fecha?: string, senal?: AbortSignal): Promise<ResultadoDelMapa> {
  const ruta = fecha ? `/api/disponibilidad?fecha=${encodeURIComponent(fecha)}` : "/api/disponibilidad";
  const respuesta = await enviarJson<MapaDelDia>(ruta, "GET", undefined, senal);
  if (respuesta.tipo === "aceptado") return { tipo: "consultado", mapa: respuesta.cuerpo };
  if (respuesta.tipo === "rechazado") return { tipo: "error", mensaje: respuesta.errores.fecha ?? respuesta.mensaje };
  return { tipo: "error", mensaje: respuesta.mensaje };
}
