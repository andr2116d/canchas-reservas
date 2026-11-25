import { Suspense } from "react";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import { AccesoDeLaPortada } from "./acceso-de-la-portada";

/** La misma barra de vidrio de los paneles: marca, secciones de la portada y el acceso. */
export function BarraDeLaPortada() {
  return (
    <header className="barra-de-vidrio portada__barra">
      <div className="barra-de-vidrio__fila">
        <a href="#inicio" className="flex items-center gap-3">
          <MonogramaLaPrevia className="h-9 w-auto" />
          <span className="font-titular text-xl leading-none font-black text-papel">La Previa</span>
        </a>
        <nav aria-label="Portada" className="portada__secciones">
          <a href="#turnos" className="barra-de-vidrio__seccion">Turnos libres</a>
          <a href="#como-se-reserva" className="barra-de-vidrio__seccion">Cómo se reserva</a>
        </nav>
        <div className="flex items-center gap-1.5">
          <Suspense fallback={<span className="portada__boton invisible">Ingresar</span>}>
            <AccesoDeLaPortada />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
