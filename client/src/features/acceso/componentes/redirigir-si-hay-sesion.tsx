import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destinoDeSesion } from "@/compartido/sesion/destino-de-sesion";
import { consultarSesionEnServidor } from "@/compartido/sesion/sesion.servidor";

/** Lleva a su panel a quien ya tiene una sesión abierta. No muestra nada. */
export async function RedirigirSiHaySesion() {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (sesion) redirect(destinoDeSesion(sesion));
  return null;
}
