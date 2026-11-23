"use client";

import { escribirHora, leerHora } from "../utilidades/pasos-del-marcador";
import { ColumnaDelMarcador } from "./columna-del-marcador";

export interface MarcadorDeHoraProps {
  id: string;
  etiqueta: string;
  /** Hora en «HH:MM». */
  valor: string;
  alCambiar: (valor: string) => void;
  /** Permite 24:00, para el cierre. */
  hastaMedianoche?: boolean;
  /** Horas comunes a un toque. */
  atajos?: string[];
  error?: string;
}

const PASO_DE_MINUTOS = 5;

/**
 * Selector de hora con aspecto de marcador de estadio: horas y minutos en
 * cifras grandes que se cambian con flechas, teclado, rueda o escribiendo.
 */
export function MarcadorDeHora({ id, etiqueta, valor, alCambiar, hastaMedianoche = false, atajos = [], error }: MarcadorDeHoraProps) {
  const { horas, minutos } = leerHora(valor);
  const idError = `${id}-error`;
  const enMedianoche = horas === 24;

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-etiqueta`} className="text-sm font-semibold text-tinta">{etiqueta}</span>
      <div role="group" aria-labelledby={`${id}-etiqueta`} className={`inline-flex w-fit items-center gap-0.5 rounded-xl bg-cancha px-1.5 py-1 shadow-[inset_0_2px_6px_rgb(0_0_0/0.45)] ring-2 ${error ? "ring-error" : "ring-cancha-clara"}`}>
        <ColumnaDelMarcador
          id={`${id}-horas`}
          nombre={`Horas de ${etiqueta}`}
          valor={horas}
          maximo={hastaMedianoche ? 24 : 23}
          paso={1}
          alCambiar={(nuevas) => alCambiar(escribirHora(nuevas, nuevas === 24 ? 0 : minutos))}
          alCompletar={() => document.getElementById(`${id}-minutos`)?.focus()}
          invalida={Boolean(error)}
          descripcion={error ? idError : undefined}
        />
        <span aria-hidden="true" className="font-titular text-3xl font-black text-capitan/70">:</span>
        <ColumnaDelMarcador
          id={`${id}-minutos`}
          nombre={`Minutos de ${etiqueta}`}
          valor={minutos}
          maximo={59}
          paso={PASO_DE_MINUTOS}
          alCambiar={(nuevos) => alCambiar(escribirHora(horas, nuevos))}
          deshabilitada={enMedianoche}
          invalida={Boolean(error)}
          descripcion={error ? idError : undefined}
        />
      </div>
      {atajos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {atajos.map((atajo) => (
            <button key={atajo} type="button" onClick={() => alCambiar(atajo)} aria-pressed={atajo === valor} className="rounded-full border border-linea bg-papel px-2.5 py-1 text-xs font-semibold text-botella tabular-nums hover:border-botella/40 aria-pressed:border-botella aria-pressed:bg-botella aria-pressed:text-papel">
              {atajo}
            </button>
          ))}
        </div>
      )}
      <p id={idError} aria-live="polite" className="text-sm font-medium text-error empty:hidden">{error}</p>
    </div>
  );
}
