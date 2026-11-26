import { ERROR_INESPERADO, SIN_CONEXION } from "@/compartido/api/enviar-json";
import type { HorarioParaSimular, Simulacion, TarifaParaSimular } from "./simulacion";

export type ResultadoDeLaSimulacion = { tipo: "simulado"; simulacion: Simulacion } | { tipo: "error"; mensaje: string };

/**
 * Pide al server los turnos de la semana con lo que se está editando, sin guardar
 * nada. Es el mismo cálculo que usarán las reservas.
 */
export async function simularTurnos(
  datos: { horario: HorarioParaSimular; tarifas: TarifaParaSimular[] },
  senal?: AbortSignal,
): Promise<ResultadoDeLaSimulacion> {
  let respuesta: Response;
  try {
    respuesta = await fetch("/api/tarifas/simulacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      credentials: "same-origin",
      signal: senal,
    });
  } catch {
    return { tipo: "error", mensaje: SIN_CONEXION };
  }
  if (respuesta.ok) return { tipo: "simulado", simulacion: (await respuesta.json()) as Simulacion };
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { mensaje?: string };
  return { tipo: "error", mensaje: cuerpo.mensaje ?? ERROR_INESPERADO };
}
