import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destinoDeSesion, RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { consultarSesionEnServidor } from "@/compartido/sesion/sesion.servidor";
import { ACCION_PRINCIPAL_DEL_AVISO, PantallaDeAviso } from "@/compartido/ui/pantalla-de-aviso";

/** Avisa que la cuenta no puede abrir esa pantalla y la lleva de vuelta a su panel. */
export async function AccesoDenegado() {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (!sesion) redirect(RUTA_DE_ACCESO);

  return (
    <PantallaDeAviso
      codigo="403"
      titulo="Esta zona no es para tu cuenta"
      mensaje="Tu cuenta no tiene permiso para abrir esta pantalla."
    >
      <Link href={destinoDeSesion(sesion)} prefetch={false} className={ACCION_PRINCIPAL_DEL_AVISO}>
        Ir a mi panel
      </Link>
    </PantallaDeAviso>
  );
}
