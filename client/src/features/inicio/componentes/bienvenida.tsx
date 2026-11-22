import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import { obtenerCuenta } from "../servicios/cuenta.api";

/** Saludo al jugador con sesión iniciada. Sin sesión, lo lleva a crear su cuenta. */
export async function Bienvenida() {
  const cuenta = await obtenerCuenta((await cookies()).toString());
  if (!cuenta) redirect("/registro");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-12 sm:px-10">
      <MonogramaLaPrevia className="h-12 w-auto self-start" />
      <h1 className="font-titular text-6xl leading-none font-black text-tinta">
        Hola, {cuenta.nombres}.
      </h1>
      <p className="text-lg text-grava">Tu cuenta en La Previa está lista.</p>
    </main>
  );
}
