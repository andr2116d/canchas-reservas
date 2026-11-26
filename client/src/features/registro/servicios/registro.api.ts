import { enviarJson } from "@/compartido/api/enviar-json";
import type { DatosRegistro } from "../esquemas/registro.schema";

export type ErroresDeRegistro = Partial<Record<keyof DatosRegistro, string>>;

export type ResultadoRegistro =
  | { tipo: "registrado"; nombres: string }
  | { tipo: "datos-rechazados"; errores: ErroresDeRegistro }
  | { tipo: "error"; mensaje: string };

/**
 * Crea la cuenta del jugador. Si sale bien, el server deja la sesión iniciada
 * en una cookie; la respuesta solo trae los nombres.
 */
export async function registrarJugador(datos: DatosRegistro): Promise<ResultadoRegistro> {
  const respuesta = await enviarJson<{ nombres?: string }>("/api/jugadores", "POST", datos);
  if (respuesta.tipo === "aceptado") return { tipo: "registrado", nombres: respuesta.cuerpo?.nombres ?? "" };
  if (respuesta.tipo === "rechazado" && Object.keys(respuesta.errores).length > 0) {
    return { tipo: "datos-rechazados", errores: respuesta.errores };
  }
  return { tipo: "error", mensaje: respuesta.mensaje };
}
