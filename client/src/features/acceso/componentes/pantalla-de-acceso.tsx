import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destinoDeSesion } from "@/compartido/sesion/destino-de-sesion";
import { consultarSesionEnServidor } from "@/compartido/sesion/sesion.servidor";
import { FondoDeCancha } from "@/compartido/ui/fondo-de-cancha";
import { CAMBIO_DE_ACCESO, TransicionDeAcceso } from "@/compartido/ui/transicion-de-acceso";
import { FormularioDeAcceso } from "./formulario-de-acceso";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

type ParametrosDeAcceso = Promise<{ motivo?: string | string[] }>;

/** Muestra el acceso o lleva a su panel a quien ya tiene una sesión. */
export async function PantallaDeAcceso({ parametros }: { parametros: ParametrosDeAcceso }) {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (sesion) redirect(destinoDeSesion(sesion));
  const { motivo } = await parametros;

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-cancha">
      <FondoDeCancha encuadre="acceso" />
      <TransicionDeAcceso>
        <TarjetaDeAcceso titulo="Inicia sesión" sobreCancha>
          {motivo === "inactividad" && (
            <p role="status" className="mb-5 rounded-lg bg-tiza px-4 py-3 text-sm text-grava">Tu sesión se cerró por inactividad.</p>
          )}
          <FormularioDeAcceso />
          <p className="mt-6 border-t border-linea pt-4 text-center text-sm text-grava">
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/registro"
              transitionTypes={[CAMBIO_DE_ACCESO]}
              className="inline-flex min-h-11 items-center rounded-sm font-bold text-botella underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella"
            >
              Crea tu cuenta de jugador
            </Link>
          </p>
        </TarjetaDeAcceso>
      </TransicionDeAcceso>
    </div>
  );
}
