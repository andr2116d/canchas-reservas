import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  debePedirCambioDeContrasena,
  destinoDeSesion,
  RUTA_DE_ACCESO,
  RUTA_DE_CAMBIO,
  type EstadoDeSesion,
  type Rol,
} from "./destino-de-sesion";

export function consultarApiPrivada(ruta: string, cookie: string): Promise<Response> {
  const url = process.env.API_URL ?? "http://localhost:3001";
  return fetch(`${url}/api/${ruta}`, { headers: { cookie }, cache: "no-store" });
}

export async function consultarSesionEnServidor(cookie: string): Promise<EstadoDeSesion | undefined> {
  if (!cookie) return undefined;
  const respuesta = await consultarApiPrivada("sesiones/actual", cookie);
  if (respuesta.status === 401) return undefined;
  if (!respuesta.ok) throw new Error("No pudimos comprobar tu sesión.");
  return await respuesta.json() as EstadoDeSesion;
}

export async function exigirPanel(rol: Rol) {
  const cookie = (await cookies()).toString();
  const sesion = await consultarSesionEnServidor(cookie);
  if (!sesion) redirect(RUTA_DE_ACCESO);
  if (debePedirCambioDeContrasena(sesion)) redirect(RUTA_DE_CAMBIO);
  if (sesion.rol !== rol) redirect("/acceso-no-autorizado");
  return { cookie, sesion };
}

export async function exigirCambioDeContrasena(): Promise<EstadoDeSesion> {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (!sesion) redirect(RUTA_DE_ACCESO);
  if (!sesion.requiereCambiarContrasena) redirect(destinoDeSesion(sesion));
  return sesion;
}
