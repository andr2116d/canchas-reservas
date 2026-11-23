import { EsperaDeCancha } from "../ui/espera-de-cancha";

/**
 * Lo que se ve mientras carga una sección del panel: los botines en la misma
 * franja de cancha del encabezado y el contenido en espera, sin salto de color.
 */
export function CargaDelPanel() {
  return (
    <>
      <header className="encabezado-de-seccion">
        <EsperaDeCancha variante="franja" />
      </header>
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="h-56 animate-pulse rounded-2xl border border-white/80 bg-papel/80 shadow-sm motion-reduce:animate-none" />
        <div className="h-56 animate-pulse rounded-2xl border border-white/80 bg-papel/80 shadow-sm motion-reduce:animate-none" />
      </div>
    </>
  );
}
