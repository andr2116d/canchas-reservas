import Link from "next/link";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import { CAMBIO_DE_ACCESO } from "@/compartido/ui/transicion-de-acceso";

/** Mantiene el acceso a una cuenta existente a la vista del jugador. */
export function CabeceraDeRegistro() {
  return (
    <header className="relative z-10 flex min-h-17 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-linea bg-papel px-4 py-2 sm:px-10">
      <Link href="/" className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella">
        <MonogramaLaPrevia aria-hidden="true" className="h-8 w-auto shrink-0" />
        <span className="font-titular text-2xl leading-none font-black">La Previa</span>
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-x-3 text-sm">
        <span className="hidden text-grava sm:inline">¿Ya tienes cuenta?</span>
        <Link
          href={RUTA_DE_ACCESO}
          transitionTypes={[CAMBIO_DE_ACCESO]}
          className="inline-flex min-h-11 items-center rounded-lg border border-linea px-3 font-bold text-botella hover:bg-tiza focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella"
        >
          Inicia sesión
        </Link>
      </div>
    </header>
  );
}
