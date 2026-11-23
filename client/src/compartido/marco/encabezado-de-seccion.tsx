import type { ReactNode } from "react";

/** Título grande de una pantalla interna, con su descripción y, si hace falta, una acción. */
export function EncabezadoDeSeccion({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="font-titular text-5xl leading-none font-black text-tinta sm:text-6xl">{titulo}</h1>
        {descripcion && <p className="mt-3 text-lg text-grava">{descripcion}</p>}
      </div>
      {accion}
    </header>
  );
}
