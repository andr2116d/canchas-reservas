import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destinoDeSesion, RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { consultarSesionEnServidor } from "@/compartido/sesion/sesion.servidor";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

/** Informa el rechazo y ofrece volver al panel de la sesión. */
export async function AccesoDenegado() {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (!sesion) redirect(RUTA_DE_ACCESO);

  return (
    <TarjetaDeAcceso titulo="Acceso no autorizado">
      <p className="mb-5 text-grava">Tu cuenta no tiene permiso para abrir esa pantalla.</p>
      <Link href={destinoDeSesion(sesion)} prefetch={false} className="font-bold text-botella underline underline-offset-4">Volver a mi panel</Link>
    </TarjetaDeAcceso>
  );
}
