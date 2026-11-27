import { enviarJson } from "@/compartido/api/enviar-json";
import type { TurnoElegido } from "@/compartido/sesion/turno-elegido";
import type { PedidoDeReserva, ResumenDeReserva } from "./reservas";

export type ResultadoDelResumen =
  | { tipo: "consultado"; resumen: ResumenDeReserva }
  | { tipo: "no-disponible"; mensaje: string }
  | { tipo: "sin-sesion" }
  | { tipo: "error"; mensaje: string };

export type ResultadoDeSeparar =
  | { tipo: "separada"; codigo: string }
  | { tipo: "montos-cambiaron"; mensaje: string; precio: string; adelanto: string }
  | { tipo: "rechazada"; mensaje: string }
  | { tipo: "sin-sesion" };

const SIN_SESION = 401;

/** El resumen del turno elegido antes de separarlo; dice por qué si ya no se puede. */
export async function consultarResumen(turno: TurnoElegido, senal?: AbortSignal): Promise<ResultadoDelResumen> {
  const parametros = new URLSearchParams({ canchaId: String(turno.canchaId), fecha: turno.fecha, desde: turno.desde });
  const respuesta = await enviarJson<ResumenDeReserva>(`/api/reservas/resumen?${parametros.toString()}`, "GET", undefined, senal);
  if (respuesta.tipo === "aceptado") return { tipo: "consultado", resumen: respuesta.cuerpo };
  if (respuesta.tipo === "sin-conexion") return { tipo: "error", mensaje: respuesta.mensaje };
  if (respuesta.estado === SIN_SESION) return { tipo: "sin-sesion" };
  if (respuesta.estado === 400 || respuesta.estado === 409) {
    return { tipo: "no-disponible", mensaje: Object.values(respuesta.errores)[0] ?? respuesta.mensaje };
  }
  return { tipo: "error", mensaje: respuesta.mensaje };
}

/** Separa el turno con los montos que se mostraron; si cambiaron, trae los nuevos. */
export async function separarTurno(pedido: PedidoDeReserva): Promise<ResultadoDeSeparar> {
  const respuesta = await enviarJson<{ codigo: string }>("/api/reservas", "POST", pedido);
  if (respuesta.tipo === "aceptado") return { tipo: "separada", codigo: respuesta.cuerpo.codigo };
  if (respuesta.tipo === "sin-conexion") return { tipo: "rechazada", mensaje: respuesta.mensaje };
  if (respuesta.estado === SIN_SESION) return { tipo: "sin-sesion" };
  const { precio, adelanto } = respuesta.datos ?? {};
  if (typeof precio === "string" && typeof adelanto === "string") {
    return { tipo: "montos-cambiaron", mensaje: respuesta.mensaje, precio, adelanto };
  }
  return { tipo: "rechazada", mensaje: Object.values(respuesta.errores)[0] ?? respuesta.mensaje };
}
