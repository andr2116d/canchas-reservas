import type { EstadoDeSesion } from "./destino-de-sesion";

export async function consultarSesion(): Promise<EstadoDeSesion | undefined> {
  const respuesta = await fetch("/api/sesiones/actual", { cache: "no-store" });
  if (respuesta.status === 401) return undefined;
  if (!respuesta.ok) throw new Error("No pudimos comprobar tu sesión.");
  return await respuesta.json() as EstadoDeSesion;
}

export async function cerrarSesion(): Promise<void> {
  const respuesta = await fetch("/api/sesiones/actual", { method: "DELETE" });
  if (!respuesta.ok) throw new Error("No pudimos cerrar tu sesión. Inténtalo de nuevo.");
}
