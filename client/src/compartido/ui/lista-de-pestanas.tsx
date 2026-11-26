"use client";

import type { KeyboardEvent } from "react";

interface Pestana<Valor extends string> {
  valor: Valor;
  texto: string;
  /** Clases extra, como ocultarla en pantallas anchas. */
  className?: string;
}

interface ListaDePestanasProps<Valor extends string> {
  etiqueta: string;
  pestanas: readonly Pestana<Valor>[];
  activa: Valor;
  alElegir: (valor: Valor) => void;
}

const DESPLAZAMIENTO: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

/**
 * Pestañas de vidrio sobre la cancha, según el patrón de pestañas de WAI-ARIA:
 * las flechas, Inicio y Fin mueven el foco y eligen; solo la activa entra al tabulador.
 * Cada pestaña controla el panel `panel-<valor>`.
 */
export function ListaDePestanas<Valor extends string>({ etiqueta, pestanas, activa, alElegir }: ListaDePestanasProps<Valor>) {
  function alPulsarTecla(evento: KeyboardEvent<HTMLDivElement>) {
    const actual = pestanas.findIndex((pestana) => pestana.valor === activa);
    const destinos: Record<string, number> = { Home: 0, End: pestanas.length - 1 };
    const indice =
      evento.key in DESPLAZAMIENTO
        ? (actual + DESPLAZAMIENTO[evento.key] + pestanas.length) % pestanas.length
        : destinos[evento.key];
    if (indice === undefined) return;
    evento.preventDefault();
    alElegir(pestanas[indice].valor);
    document.getElementById(`pestana-${pestanas[indice].valor}`)?.focus();
  }

  return (
    <div role="tablist" aria-label={etiqueta} onKeyDown={alPulsarTecla} className="vidrio-verde flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-2xl p-1">
      {pestanas.map(({ valor, texto, className = "" }) => (
        <button
          key={valor}
          type="button"
          role="tab"
          id={`pestana-${valor}`}
          aria-selected={activa === valor}
          aria-controls={`panel-${valor}`}
          tabIndex={activa === valor ? 0 : -1}
          onClick={() => alElegir(valor)}
          className={`relative rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap text-tiza/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-capitan aria-selected:bg-papel aria-selected:text-tinta aria-selected:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_4px_14px_-6px_rgb(0_0_0/0.45)] ${className}`}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}
