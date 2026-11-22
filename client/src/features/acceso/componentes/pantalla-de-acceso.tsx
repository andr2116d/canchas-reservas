import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destinoDeSesion } from "@/compartido/sesion/destino-de-sesion";
import { consultarSesionEnServidor } from "@/compartido/sesion/sesion.servidor";
import { FormularioDeAcceso } from "./formulario-de-acceso";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

type ParametrosDeAcceso = Promise<{ motivo?: string | string[] }>;

/** Muestra el acceso o lleva a su panel a quien ya tiene una sesión. */
export async function PantallaDeAcceso({ parametros }: { parametros: ParametrosDeAcceso }) {
  const sesion = await consultarSesionEnServidor((await cookies()).toString());
  if (sesion) redirect(destinoDeSesion(sesion));
  const { motivo } = await parametros;

  return (
    <TarjetaDeAcceso titulo="Inicia sesión">
      {motivo === "inactividad" && (
        <p role="status" className="mb-5 rounded-lg bg-tiza px-4 py-3 text-sm text-grava">Tu sesión se cerró por inactividad.</p>
      )}
      <FormularioDeAcceso />
      <p className="mt-6 text-center text-sm text-grava">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/registro" className="font-bold text-botella underline underline-offset-4">Crea tu cuenta de jugador</Link>
      </p>
    </TarjetaDeAcceso>
  );
}
