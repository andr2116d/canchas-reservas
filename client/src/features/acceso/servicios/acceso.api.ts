import type { DestinoDeSesion } from "@/compartido/sesion/destino-de-sesion";

export type ResultadoAcceso =
  | ({ tipo: "autenticado" } & DestinoDeSesion)
  | { tipo: "error"; mensaje: string; sesionVencida?: boolean };

interface Credenciales {
  correo: string;
  contrasena: string;
}

interface ErrorDeAcceso {
  mensaje?: string;
  errores?: { contrasena?: string };
}

export function iniciarSesion(datos: Credenciales): Promise<ResultadoAcceso> {
  return enviarAcceso("/api/sesiones", "POST", datos);
}

export function cambiarContrasenaTemporal(contrasena: string): Promise<ResultadoAcceso> {
  return enviarAcceso("/api/sesiones/contrasena-temporal", "PATCH", { contrasena });
}

export type ResultadoDeOmision =
  | { tipo: "omitido" }
  | { tipo: "error"; mensaje: string; sesionVencida?: boolean };

/** Deja el cambio de la contraseña temporal para después, solo en esta sesión. */
export async function omitirCambioDeContrasena(): Promise<ResultadoDeOmision> {
  try {
    const respuesta = await fetch("/api/sesiones/actual/cambio-omitido", { method: "POST" });
    if (respuesta.ok) return { tipo: "omitido" };
    return {
      tipo: "error",
      mensaje: "No pudimos dejar el cambio para después. Inténtalo de nuevo.",
      sesionVencida: respuesta.status === 401,
    };
  } catch {
    return { tipo: "error", mensaje: "No pudimos conectar con La Previa. Inténtalo de nuevo." };
  }
}

async function enviarAcceso(ruta: string, method: "POST" | "PATCH", datos: Credenciales | { contrasena: string }): Promise<ResultadoAcceso> {
  try {
    const respuesta = await fetch(ruta, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (respuesta.ok) {
      const destino = await respuesta.json() as DestinoDeSesion;
      return { tipo: "autenticado", ...destino };
    }
    const error = await respuesta.json().catch(() => ({})) as ErrorDeAcceso;
    return {
      tipo: "error",
      mensaje: error.errores?.contrasena ?? error.mensaje ?? "No pudimos completar la solicitud. Inténtalo de nuevo.",
      sesionVencida: method === "PATCH" && respuesta.status === 401,
    };
  } catch {
    return { tipo: "error", mensaje: "No pudimos conectar con La Previa. Inténtalo de nuevo." };
  }
}
