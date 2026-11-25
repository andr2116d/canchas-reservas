import Link from "next/link";
import { Suspense } from "react";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import { AccesoDelSitio } from "./acceso-del-sitio";
import { MenuDelSitio } from "./menu-del-sitio";

/** Barra de vidrio de las páginas públicas: marca, secciones de la portada y acceso a la cuenta. */
export function BarraDelSitio() {
  return (
    <header className="barra-del-sitio">
      <div className="barra-del-sitio__vidrio">
        <Link href="/" className="flex items-center gap-2.5" aria-label="La Previa, inicio">
          <MonogramaLaPrevia className="h-9 w-auto" aria-hidden="true" />
          <span className="font-titular text-2xl leading-none font-black text-papel max-[420px]:hidden">La Previa</span>
        </Link>
        <MenuDelSitio />
        <div className="flex items-center gap-1.5">
          <Suspense fallback={<span className="boton-del-sitio invisible">Crear cuenta</span>}>
            <AccesoDelSitio />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
