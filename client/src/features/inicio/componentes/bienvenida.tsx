import { redirect } from "next/navigation";
import { BarraDeSesion } from "@/compartido/sesion/barra-de-sesion";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { exigirPanel } from "@/compartido/sesion/sesion.servidor";
import { obtenerCuenta } from "../servicios/cuenta.api";

/** Saludo al jugador que tiene una sesión válida. */
export async function Bienvenida() {
  const { cookie, sesion } = await exigirPanel("JUGADOR");
  const cuenta = await obtenerCuenta(cookie);
  if (!cuenta) redirect(RUTA_DE_ACCESO);

  return (
    <>
      <BarraDeSesion venceEn={sesion.venceEn} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8">
        <h1 className="font-titular text-6xl leading-none font-black text-tinta">
          Hola, {cuenta.nombres}.
        </h1>
        <p className="text-lg text-grava">Tu cuenta en La Previa está lista.</p>
      </main>
    </>
  );
}
