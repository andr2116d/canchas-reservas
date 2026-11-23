import type { ReactNode } from "react";

/**
 * Título grande de una pantalla interna sobre la franja de cancha, con su
 * descripción y, si hace falta, una acción. La franja crece con el texto.
 */
export function EncabezadoDeSeccion({
  titulo,
  descripcion,
  accion,
  sello,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  /** Etiqueta corta sobre el título, como el estado de una cuenta. */
  sello?: ReactNode;
}) {
  return (
    <header className="encabezado-de-seccion">
      <div className="max-w-2xl">
        {sello && <div className="mb-3">{sello}</div>}
        <h1 className="font-titular text-5xl leading-none font-black text-balance text-papel sm:text-6xl">{titulo}</h1>
        {descripcion && <p className="mt-3 text-lg text-pretty text-tiza/80">{descripcion}</p>}
      </div>
      {accion}
    </header>
  );
}
