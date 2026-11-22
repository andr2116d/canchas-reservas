import { FichaJugador } from "./ficha-jugador";

/** Panel con el césped de fondo y la ficha que se llena en vivo. */
export function PanelDeLaFicha() {
  return (
    <aside className="relative isolate flex flex-col justify-between gap-8 overflow-hidden bg-cancha px-6 py-8 text-papel sm:px-10 lg:min-h-dvh lg:py-12">
      {/* Franjas de césped cortado y la media luna de la cancha, en tiza. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(90deg,var(--color-cancha)_0_64px,var(--color-cancha-clara)_64px_128px)]"
      />
      <svg aria-hidden="true" viewBox="0 0 400 400" className="absolute -right-32 -bottom-32 -z-10 w-[28rem] opacity-25">
        <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="3" />
        <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="3" />
        <circle cx="200" cy="200" r="5" fill="currentColor" />
      </svg>
      <div className="max-w-md">
        <p className="font-titular text-6xl leading-[0.9] font-black sm:text-7xl">Te fichamos.</p>
        <p className="mt-3 max-w-xs text-base text-papel/80">
          Con tu cuenta reservas canchas de fútbol 5 y 7 y sigues tus partidos.
        </p>
      </div>
      <div className="flex justify-center pb-2 lg:justify-start">
        <FichaJugador />
      </div>
    </aside>
  );
}
