"use client";

import { useState } from "react";
import { useDiasALaVista } from "../hooks/use-dias-a-la-vista";
import { fechasEntre, nombreCorto, nombreDelMes, nombreLargo, numeroDelDia } from "../utilidades/fechas-de-la-tira";

interface SelectorDeFechaProps {
  fecha: string;
  hoy: string;
  ultimaFecha: string;
  alElegir: (fecha: string) => void;
}

const FLECHA =
  "grid size-11 place-items-center rounded-xl text-xl font-bold text-botella transition-colors hover:bg-tiza " +
  "focus-visible:outline-2 focus-visible:outline-botella disabled:cursor-not-allowed disabled:text-linea disabled:hover:bg-transparent";

/** Días de hoy a la última fecha que se puede consultar: siete a la vista, cinco en el celular. */
export function SelectorDeFecha({ fecha, hoy, ultimaFecha, alElegir }: SelectorDeFechaProps) {
  const dias = fechasEntre(hoy, ultimaFecha);
  const aLaVista = useDiasALaVista();
  const limitar = (indice: number) => Math.max(0, Math.min(indice, dias.length - aLaVista));
  // Al empezar se ve el grupo de días que contiene la fecha elegida, desde hoy.
  const [inicioElegido, setInicio] = useState<number>();
  const inicio = limitar(inicioElegido ?? Math.floor(Math.max(dias.indexOf(fecha), 0) / aLaVista) * aLaVista);
  const visibles = dias.slice(inicio, inicio + aLaVista);
  const mover = (paso: number) => setInicio(limitar(inicio + paso));

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <div role="group" aria-label="Fecha" className="vidrio-claro flex max-w-full items-center gap-0.5 rounded-2xl p-1">
        <button type="button" aria-label="Días anteriores" disabled={inicio === 0} onClick={() => mover(-aLaVista)} className={FLECHA}>‹</button>
        <div className="flex gap-0.5">
          {visibles.map((dia) => (
            <button
              key={dia}
              type="button"
              aria-pressed={dia === fecha}
              aria-label={nombreLargo(dia)}
              onClick={() => alElegir(dia)}
              className="group grid w-12 justify-items-center rounded-xl py-1 transition-colors hover:bg-tiza focus-visible:outline-2 focus-visible:outline-botella aria-pressed:bg-cancha aria-pressed:text-papel aria-pressed:hover:bg-cancha"
            >
              <span className="text-[0.7rem] font-semibold text-grava capitalize group-aria-pressed:text-capitan">{nombreCorto(dia, hoy)}</span>
              <span className="font-titular text-2xl leading-none font-extrabold tabular-nums">{numeroDelDia(dia)}</span>
            </button>
          ))}
        </div>
        <button type="button" aria-label="Días siguientes" disabled={inicio + aLaVista >= dias.length} onClick={() => mover(aLaVista)} className={FLECHA}>›</button>
      </div>
      <p className="text-sm text-grava">
        {nombreDelMes(visibles[0])} · puedes ver hasta el {nombreLargo(ultimaFecha).replace(/^\S+ /, "")}
      </p>
    </div>
  );
}
