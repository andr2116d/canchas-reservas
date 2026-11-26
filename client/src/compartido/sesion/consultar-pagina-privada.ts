import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { RUTA_DE_ACCESO } from "./destino-de-sesion";
import { consultarApiPrivada } from "./sesion.servidor";

/**
 * Consulta la API con la sesión de quien abre la página y traduce las respuestas
 * de acceso: sin sesión vuelve al acceso, sin permiso al aviso y lo que no existe al 404.
 */
export async function consultarPaginaPrivada<T>(ruta: string, errorDeCarga: string): Promise<T> {
  const respuesta = await consultarApiPrivada(ruta, (await cookies()).toString());
  if (respuesta.status === 401) redirect(RUTA_DE_ACCESO);
  if (respuesta.status === 403) redirect("/acceso-no-autorizado");
  if (respuesta.status === 404) notFound();
  if (!respuesta.ok) throw new Error(errorDeCarga);
  return (await respuesta.json()) as T;
}
