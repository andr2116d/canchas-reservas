import { cookies } from "next/headers";
import Link from "next/link";
import { consultarSesionEnServidor } from "@/compartido/sesion/sesion.servidor";
import { destinoDeSesion, RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";

/** Con sesión, lleva al panel de quien entra; sin sesión, a ingresar o crear la cuenta. */
export async function AccesoDeLaPortada() {
  const sesion = await consultarSesionEnServidor((await cookies()).toString()).catch(() => undefined);
  if (sesion) {
    return <Link href={destinoDeSesion(sesion)} className="portada__boton portada__boton--capitan">Ir a mi panel</Link>;
  }
  return (
    <>
      <Link href={RUTA_DE_ACCESO} className="portada__boton">Ingresar</Link>
      <Link href="/registro" className="portada__boton portada__boton--capitan">Crear cuenta</Link>
    </>
  );
}
