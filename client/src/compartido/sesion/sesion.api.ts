import type { EstadoDeSesion } from "./destino-de-sesion";

/**
 * Cuánto le queda a la sesión según el reloj del server (cabecera `Date`), no el del
 * dispositivo, que puede estar adelantado o atrasado. `undefined` si ya no es válida.
 */
export async function consultarTiempoRestante(): Promise<number | undefined> {
  const respuesta = await fetch("/api/sesiones/actual", { cache: "no-store" });
  if (respuesta.status === 401) return undefined;
  if (!respuesta.ok) throw new Error("No pudimos comprobar tu sesión.");
  const { venceEn } = (await respuesta.json()) as EstadoDeSesion;
  const ahoraEnElServer = Date.parse(respuesta.headers.get("date") ?? "");
  return Date.parse(venceEn) - (Number.isNaN(ahoraEnElServer) ? Date.now() : ahoraEnElServer);
}

export async function cerrarSesion(): Promise<void> {
  const respuesta = await fetch("/api/sesiones/actual", { method: "DELETE" });
  if (!respuesta.ok) throw new Error("No pudimos cerrar tu sesión. Inténtalo de nuevo.");
}
