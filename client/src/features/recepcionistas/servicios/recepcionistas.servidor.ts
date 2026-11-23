import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { consultarApiPrivada } from "@/compartido/sesion/sesion.servidor";
import type { EstadoDelListado, FichaConHistorial, FichaDeRecepcionista } from "./ficha-de-recepcionista";

/** Consulta la API con la sesión de quien abre la página y traduce las respuestas de acceso. */
async function consultar<T>(ruta: string): Promise<T> {
  const respuesta = await consultarApiPrivada(ruta, (await cookies()).toString());
  if (respuesta.status === 401) redirect(RUTA_DE_ACCESO);
  if (respuesta.status === 403) redirect("/acceso-no-autorizado");
  if (respuesta.status === 404) notFound();
  if (!respuesta.ok) throw new Error("No pudimos cargar las recepcionistas.");
  return (await respuesta.json()) as T;
}

export function listarRecepcionistas(estado: EstadoDelListado): Promise<FichaDeRecepcionista[]> {
  return consultar(`recepcionistas?estado=${estado}`);
}

export function obtenerFicha(id: string): Promise<FichaConHistorial> {
  return consultar(`recepcionistas/${encodeURIComponent(id)}`);
}
