import { cookies, headers } from "next/headers";
import { cabecerasParaLaApi } from "./cabeceras-para-la-api";
import { redirect } from "next/navigation";
import {
  debePedirCambioDeContrasena,
  destinoDeSesion,
  RUTA_DE_ACCESO,
  type EstadoDeSesion,
  type Rol,
} from "./destino-de-sesion";

export async function consultarApiPrivada(ruta: string, cookie: string): Promise<Response> {
  const url = process.env.API_URL ?? "http://localhost:3001";
  const ipReenviada = (await headers()).get("x-forwarded-for") ?? undefined;
  return fetch(`${url}/api/${ruta}`, { headers: cabecerasParaLaApi(cookie, ipReenviada), cache: "no-store" });
}

export async function consultarSesionEnServidor(cookie: string): Promise<EstadoDeSesion | undefined> {
  if (!cookie) return undefined;
  const respuesta = await consultarApiPrivada("sesiones/actual", cookie);
  if (respuesta.status === 401) return undefined;
  if (!respuesta.ok) throw new Error("No pudimos comprobar tu sesión.");
  return await respuesta.json() as EstadoDeSesion;
}

/** La sesión de quien visita una página pública, o nada si no tiene o no se pudo comprobar. */
export async function sesionDeLaVisita(): Promise<EstadoDeSesion | undefined> {
  return consultarSesionEnServidor((await cookies()).toString()).catch(() => undefined);
}

export async function exigirPanel(rol: Rol) {
  const cookie = (await cookies()).toString();
  const sesion = await consultarSesionEnServidor(cookie);
  if (!sesion) redirect(RUTA_DE_ACCESO);
  if (sesion.requiereCompletarDatos || debePedirCambioDeContrasena(sesion)) redirect(destinoDeSesion(sesion));
  if (sesion.rol !== rol) redirect("/acceso-no-autorizado");
  return { cookie, sesion };
}

export async function exigirCambioDeContrasena(): Promise<EstadoDeSesion> {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (!sesion) redirect(RUTA_DE_ACCESO);
  if (sesion.requiereCompletarDatos || !sesion.requiereCambiarContrasena) redirect(destinoDeSesion(sesion));
  return sesion;
}

/** La sesión de quien debe completar sus datos; si no le toca, va a donde corresponde. */
export async function exigirCompletarDatos(): Promise<EstadoDeSesion & { cookie: string }> {
  const cookie = (await cookies()).toString();
  const sesion = await consultarSesionEnServidor(cookie);
  if (!sesion) redirect(RUTA_DE_ACCESO);
  if (!sesion.requiereCompletarDatos) redirect(destinoDeSesion(sesion));
  return { ...sesion, cookie };
}
