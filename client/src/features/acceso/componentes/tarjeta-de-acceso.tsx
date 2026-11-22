import type { ReactNode } from "react";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";

/** Presenta los formularios con la identidad de La Previa. */
export function TarjetaDeAcceso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[85dvh] w-full max-w-115 content-center px-5 py-9 sm:px-8">
      <div className="overflow-hidden rounded-3xl border border-linea bg-papel shadow-sm">
        <header className="flex items-center gap-3 bg-cancha px-6 py-5 text-capitan sm:px-8">
          <MonogramaLaPrevia className="h-10 w-auto shrink-0" aria-hidden="true" />
          <span className="font-titular text-2xl font-black tracking-wide">La Previa</span>
        </header>
        <div className="px-6 py-7 sm:px-8">
          <h1 className="mb-6 font-titular text-4xl leading-tight font-black text-tinta sm:text-5xl">{titulo}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
