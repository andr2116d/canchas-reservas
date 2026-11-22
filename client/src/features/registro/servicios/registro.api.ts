import type { DatosRegistro } from "../esquemas/registro.schema";

export type ErroresDeRegistro = Partial<Record<keyof DatosRegistro, string>>;

export type ResultadoRegistro =
  | { tipo: "registrado"; nombres: string }
  | { tipo: "datos-rechazados"; errores: ErroresDeRegistro }
  | { tipo: "error"; mensaje: string };

const SIN_CONEXION =
  "No pudimos conectar con La Previa. Revisa tu conexión e inténtalo de nuevo.";
const ERROR_INESPERADO = "Ocurrió un error inesperado. Inténtalo de nuevo.";

interface CuerpoDeError {
  mensaje?: string;
  errores?: ErroresDeRegistro;
}

/**
 * Crea la cuenta del jugador. Si sale bien, el server deja la sesión iniciada
 * en una cookie; la respuesta solo trae los nombres.
 */
export async function registrarJugador(datos: DatosRegistro): Promise<ResultadoRegistro> {
  let respuesta: Response;
  try {
    respuesta = await fetch("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      credentials: "same-origin",
    });
  } catch {
    return { tipo: "error", mensaje: SIN_CONEXION };
  }

  const cuerpo = (await respuesta.json().catch(() => ({}))) as CuerpoDeError & {
    nombres?: string;
  };
  if (respuesta.ok) return { tipo: "registrado", nombres: cuerpo.nombres ?? "" };
  const errores = cuerpo.errores ?? {};
  if (Object.keys(errores).length > 0) return { tipo: "datos-rechazados", errores };
  return { tipo: "error", mensaje: cuerpo.mensaje ?? ERROR_INESPERADO };
}
