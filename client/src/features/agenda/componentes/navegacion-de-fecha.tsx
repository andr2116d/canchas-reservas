"use client";

import type { ReactNode } from "react";
import { diaLargo } from "@/compartido/ui/textos-del-local";
import { sumarDias } from "../utilidades/fechas";

interface NavegacionDeFechaProps {
  fecha: string;
  hoy: string;
  ultimaFecha: string;
  alElegir: (fecha: string) => void;
  /** Lo que va al final de la fila, como el indicador «En vivo». */
  children?: ReactNode;
}

const FLECHA =
  "grid size-10 place-items-center rounded-xl text-xl font-bold text-botella transition-colors hover:bg-tiza " +
  "focus-visible:outline-2 focus-visible:outline-botella disabled:cursor-not-allowed disabled:text-linea disabled:hover:bg-transparent";

/** El día que se mira, con el anterior y el siguiente a un toque, un calendario y la vuelta a hoy. */
export function NavegacionDeFecha({ fecha, hoy, ultimaFecha, alElegir, children }: NavegacionDeFechaProps) {
  return (
    // En el celular, la fecha va arriba junto a «En vivo» y el día escrito debajo.
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div role="group" aria-label="Día" className="vidrio-claro flex items-center gap-0.5 rounded-2xl p-1">
        <button type="button" aria-label="Día anterior" onClick={() => alElegir(sumarDias(fecha, -1))} className={FLECHA}>‹</button>
        <input
          type="date"
          aria-label="Elegir fecha"
          value={fecha}
          max={ultimaFecha}
          onChange={(evento) => evento.target.value && alElegir(evento.target.value)}
          className="rounded-xl px-2 py-1.5 text-sm font-semibold text-tinta focus-visible:outline-2 focus-visible:outline-botella"
        />
        <button type="button" aria-label="Día siguiente" disabled={fecha >= ultimaFecha} onClick={() => alElegir(sumarDias(fecha, 1))} className={FLECHA}>›</button>
      </div>
      <div className="order-3 flex basis-full flex-wrap items-center gap-x-3 gap-y-2 sm:order-none sm:basis-auto">
        <h2 className="font-titular text-2xl leading-none font-extrabold text-tinta first-letter:uppercase">{diaLargo(fecha)}</h2>
        {fecha === hoy ? (
          <span className="rounded-full bg-cancha px-2.5 py-0.5 text-xs font-bold text-capitan">Hoy</span>
        ) : (
          <button type="button" onClick={() => alElegir(hoy)} className="rounded-full border border-linea bg-papel px-3 py-1 text-sm font-semibold text-botella hover:bg-tiza focus-visible:outline-2 focus-visible:outline-botella">
            Ir a hoy
          </button>
        )}
      </div>
      <div className="ml-auto">{children}</div>
    </div>
  );
}
