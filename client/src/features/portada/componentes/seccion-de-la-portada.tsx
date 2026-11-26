import type { ReactNode } from "react";

interface SeccionDeLaPortadaProps {
  id: string;
  antetitulo: string;
  titulo: string;
  bajada?: string;
  /** Fondo de franjas de césped claro, para alternar con las secciones de tiza. */
  conFranjas?: boolean;
  accion?: ReactNode;
  children: ReactNode;
}

/** Sección de la portada con su antetítulo, su título, una bajada y su contenido. */
export function SeccionDeLaPortada({ id, antetitulo, titulo, bajada, conFranjas, accion, children }: SeccionDeLaPortadaProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={`seccion-de-la-portada ${conFranjas ? "seccion-de-la-portada--franjas" : ""}`}>
      <div className="envoltura-del-sitio flex flex-col gap-9">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="antetitulo-de-la-portada">{antetitulo}</p>
            <h2 id={`${id}-titulo`} className="titulo-de-la-portada">{titulo}</h2>
            {bajada && <p className="text-lg text-pretty text-grava">{bajada}</p>}
          </div>
          {accion}
        </header>
        {children}
      </div>
    </section>
  );
}
