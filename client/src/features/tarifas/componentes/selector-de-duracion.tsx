"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { DatosDeTarifa } from "../esquemas/tarifa.schema";
import { horas } from "../utilidades/horas";

const BOTON = "h-10 w-10 bg-tiza text-lg font-bold text-botella transition-colors hover:bg-linea disabled:opacity-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-botella";

/** Duración del turno en horas enteras, de 1 a 12, con botones para restar y sumar. */
export function SelectorDeDuracion({ tipo }: { tipo: string }) {
  const { control } = useFormContext<DatosDeTarifa>();
  return (
    <Controller
      control={control}
      name="duracionDelTurno"
      render={({ field, fieldState }) => {
        const actual = Number(field.value) || 0;
        const poner = (valor: number) => field.onChange(String(Math.min(12, Math.max(1, valor))));
        return (
          <div className="flex flex-col gap-1.5">
            <span id={`${tipo}-duracion`} className="text-sm font-bold text-tinta">Cada turno dura</span>
            <div role="group" aria-labelledby={`${tipo}-duracion`} aria-describedby={fieldState.error ? `${tipo}-duracion-error` : undefined} className="inline-flex w-fit items-center overflow-hidden rounded-xl border border-linea bg-papel">
              <button type="button" aria-label="Una hora menos" disabled={actual <= 1} onClick={() => poner(actual - 1)} className={BOTON}>−</button>
              <span aria-live="polite" className="min-w-22 text-center text-sm font-bold text-tinta tabular-nums">{actual ? horas(actual) : "Elige"}</span>
              <button type="button" aria-label="Una hora más" disabled={actual >= 12} onClick={() => poner(actual + 1)} className={BOTON}>+</button>
            </div>
            <p id={`${tipo}-duracion-error`} aria-live="polite" className="text-sm font-medium text-error empty:hidden">{fieldState.error?.message}</p>
          </div>
        );
      }}
    />
  );
}
