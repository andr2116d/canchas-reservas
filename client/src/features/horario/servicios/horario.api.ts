import { enviarJson } from "@/compartido/api/enviar-json";
import { type ResultadoDeAccion, resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { datosParaGuardar } from "../utilidades/datos-del-horario";

/** Una reserva por jugar que el horario nuevo ya no atiende, con quién avisar. */
export interface ReservaFueraDeHorario {
  codigo: string;
  cancha: string;
  fecha: string;
  desde: string;
  hasta: string;
  estado: string;
  titular: string;
  celular: string | null;
}

export type ResultadoDeGuardado =
  | { tipo: "guardado"; cambio: boolean }
  | { tipo: "reservas-fuera"; mensaje: string; reservas: readonly ReservaFueraDeHorario[] }
  | Exclude<ResultadoDeAccion, { tipo: "hecho" }>;

/**
 * Guarda el horario de la semana; `cambio` es falso si ya era el mismo. Si deja reservas por
 * jugar fuera, el server no lo guarda y las devuelve, salvo que se envíe `confirmar`.
 */
export async function guardarHorario(datos: ReturnType<typeof datosParaGuardar>, confirmar = false): Promise<ResultadoDeGuardado> {
  const respuesta = await enviarJson<{ cambio: boolean }>("/api/horario", "PUT", confirmar ? { ...datos, confirmar } : datos);
  if (respuesta.tipo === "aceptado") return { tipo: "guardado", cambio: respuesta.cuerpo.cambio };
  const reservas = respuesta.tipo === "rechazado" ? respuesta.datos?.reservasFueraDeHorario : undefined;
  if (Array.isArray(reservas)) return { tipo: "reservas-fuera", mensaje: respuesta.mensaje, reservas: reservas as ReservaFueraDeHorario[] };
  return resultadoDeAccion(respuesta) as Exclude<ResultadoDeAccion, { tipo: "hecho" }>;
}
