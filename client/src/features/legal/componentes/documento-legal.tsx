import type { ReactNode } from "react";

export interface ApartadoLegal {
  id: string;
  /** Pregunta que responde el apartado, como «¿Puedo cancelar?». */
  titulo: string;
  contenido: ReactNode;
}

interface DocumentoLegalProps {
  titulo: string;
  resumen: string;
  /** Fecha desde la que rige, ya escrita: «24 de noviembre de 2026». */
  vigenteDesde: string;
  apartados: ApartadoLegal[];
}

/**
 * Página legal en lenguaje simple: título, desde cuándo rige, un índice y apartados
 * que responden una pregunta cada uno. Marco legal §8.
 */
export function DocumentoLegal({ titulo, resumen, vigenteDesde, apartados }: DocumentoLegalProps) {
  return (
    <article aria-labelledby="documento-titulo" className="documento-legal">
      <header className="documento-legal__cabecera">
        <div className="envoltura-del-sitio flex flex-col gap-4 pt-32 pb-12">
          <p className="text-sm font-extrabold tracking-[0.12em] text-capitan uppercase">Legal</p>
          <h1 id="documento-titulo" className="font-titular text-[clamp(3rem,8vw,5.5rem)] leading-[0.9] font-black text-balance text-papel">{titulo}</h1>
          <p className="max-w-2xl text-lg text-tiza/85">{resumen}</p>
          <p className="text-sm text-tiza/70">Vigente desde el <time>{vigenteDesde}</time>.</p>
        </div>
      </header>
      <div className="envoltura-del-sitio documento-legal__cuerpo">
        <nav aria-labelledby="indice-titulo" className="documento-legal__indice">
          <h2 id="indice-titulo" className="mb-3 text-xs font-extrabold tracking-[0.12em] text-botella uppercase">En esta página</h2>
          <ol className="flex flex-col gap-2 text-sm">
            {apartados.map((apartado) => (
              <li key={apartado.id}><a href={`#${apartado.id}`} className="text-grava hover:text-botella hover:underline">{apartado.titulo}</a></li>
            ))}
          </ol>
        </nav>
        <div className="flex min-w-0 flex-col gap-10">
          {apartados.map((apartado) => (
            <section key={apartado.id} id={apartado.id} aria-labelledby={`${apartado.id}-titulo`} className="documento-legal__apartado">
              <h2 id={`${apartado.id}-titulo`} className="font-titular text-3xl leading-none font-black text-cancha">{apartado.titulo}</h2>
              <div className="documento-legal__texto">{apartado.contenido}</div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
