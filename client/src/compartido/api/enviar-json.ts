/** Respuesta de error de la API: mensaje general, errores por campo y datos para resolverlo. */
export interface RechazoDeLaApi {
  tipo: "rechazado";
  estado: number;
  mensaje: string;
  errores: Record<string, string>;
  datos?: Record<string, unknown>;
}

export type RespuestaDeLaApi<T> =
  | { tipo: "aceptado"; cuerpo: T }
  | RechazoDeLaApi
  | { tipo: "sin-conexion"; mensaje: string };

export const SIN_CONEXION =
  "No pudimos conectar con La Previa. Revisa tu conexión e inténtalo de nuevo.";
export const ERROR_INESPERADO = "Ocurrió un error inesperado. Inténtalo de nuevo.";

/** Envía JSON a la API del mismo sitio y traduce la respuesta, con o sin cuerpo. Se puede cancelar con `senal`. */
export async function enviarJson<T = undefined>(
  ruta: string,
  metodo: "GET" | "POST" | "PUT" | "PATCH",
  cuerpo?: unknown,
  senal?: AbortSignal,
): Promise<RespuestaDeLaApi<T>> {
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      credentials: "same-origin",
      signal: senal,
    });
  } catch {
    return { tipo: "sin-conexion", mensaje: SIN_CONEXION };
  }
  const leido = (await respuesta.json().catch(() => undefined)) as Record<string, unknown> | undefined;
  if (respuesta.ok) return { tipo: "aceptado", cuerpo: leido as T };
  return {
    tipo: "rechazado",
    estado: respuesta.status,
    mensaje: typeof leido?.mensaje === "string" ? leido.mensaje : ERROR_INESPERADO,
    errores: (leido?.errores as Record<string, string> | undefined) ?? {},
    datos: leido?.datos as Record<string, unknown> | undefined,
  };
}
