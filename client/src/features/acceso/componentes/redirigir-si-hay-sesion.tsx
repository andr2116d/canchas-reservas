import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destinoDeSesion } from "@/compartido/sesion/destino-de-sesion";
import { consultarSesionEnServidor } from "@/compartido/sesion/sesion.servidor";
import { destinoConTurno, leerTurnoElegido } from "@/compartido/sesion/turno-elegido";
import type { ParametrosDeAcceso } from "./aviso-de-inactividad";

/** Lleva a su panel, o al turno que eligió, a quien ya tiene una sesión abierta. No muestra nada. */
export async function RedirigirSiHaySesion({ parametros }: { parametros: ParametrosDeAcceso }) {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (!sesion) return null;
  const { cancha, fecha, desde } = await parametros;
  const enTexto = (valor: unknown) => (typeof valor === "string" ? valor : "");
  const turno = leerTurnoElegido(new URLSearchParams({ cancha: enTexto(cancha), fecha: enTexto(fecha), desde: enTexto(desde) }));
  redirect(destinoConTurno(destinoDeSesion(sesion), turno));
}
