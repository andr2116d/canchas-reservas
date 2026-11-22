import { FondoDeCancha } from "@/compartido/ui/fondo-de-cancha";
import { TransicionDeAcceso } from "@/compartido/ui/transicion-de-acceso";
import { FichaJugador } from "./ficha-jugador";

/** Panel con el césped de fondo y la ficha que se llena en vivo. */
export function PanelDeLaFicha() {
  return (
    <aside className="relative isolate flex flex-col gap-6 overflow-hidden bg-cancha px-4 py-6 text-papel sm:px-10 lg:sticky lg:top-0 lg:h-dvh lg:justify-center lg:gap-14 lg:py-12">
      <FondoDeCancha encuadre="registro" />
      <TransicionDeAcceso parte="panel">
        <div className="max-w-md">
          <p className="font-titular text-5xl leading-[0.9] font-black sm:text-7xl">Te fichamos.</p>
          <p className="mt-3 hidden max-w-xs text-base text-papel/80 sm:block">
            Con tu cuenta reservas canchas de fútbol 5 y 7 y sigues tus partidos.
          </p>
        </div>
      </TransicionDeAcceso>
      <TransicionDeAcceso parte="ficha">
        <div className="flex justify-center lg:justify-start">
          <FichaJugador />
        </div>
      </TransicionDeAcceso>
    </aside>
  );
}
