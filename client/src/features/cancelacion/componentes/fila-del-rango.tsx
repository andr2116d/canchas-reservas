"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { DatosDeLaRegla } from "../esquemas/regla.schema";
import { colorDelPorcentaje } from "../utilidades/color-del-porcentaje";

const NUMERO =
  "w-12 rounded-lg border border-linea bg-papel px-2 py-1.5 text-right font-bold text-tinta tabular-nums outline-none " +
  "focus-visible:border-botella focus-visible:ring-3 focus-visible:ring-botella/25 aria-invalid:border-error read-only:border-dashed read-only:bg-transparent";

const soloCifras = (evento: { currentTarget: HTMLInputElement }) => {
  evento.currentTarget.value = evento.currentTarget.value.replace(/\D/g, "").slice(0, 3);
};

interface FilaDelRangoProps {
  indice: number;
  /** El rango desde 0 horas: siempre está y no se quita. */
  fijo: boolean;
  alQuitar: () => void;
}

/** Un rango en una línea: desde cuántas horas antes, cuánto devuelve y si también ofrece crédito. */
export function FilaDelRango({ indice, fijo, alQuitar }: FilaDelRangoProps) {
  const { register, control, formState } = useFormContext<DatosDeLaRegla>();
  const porcentaje = Number(useWatch({ control, name: `rangos.${indice}.porcentaje` })) || 0;
  const errores = formState.errors.rangos?.[indice];
  const error = errores?.desdeHoras?.message ?? errores?.porcentaje?.message;

  return (
    <li role="group" aria-label={`Rango ${indice + 1}`} className="flex w-fit max-w-full flex-col gap-1 rounded-2xl bg-tiza px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-tinta">
        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: colorDelPorcentaje(porcentaje) }} />
        Desde
        <input {...register(`rangos.${indice}.desdeHoras`)} aria-label="Horas antes" aria-invalid={Boolean(errores?.desdeHoras)} inputMode="numeric" readOnly={fijo} onInput={soloCifras} className={NUMERO} />
        h antes, devuelve
        <input {...register(`rangos.${indice}.porcentaje`)} aria-label="Porcentaje que se devuelve" aria-invalid={Boolean(errores?.porcentaje)} inputMode="numeric" onInput={soloCifras} className={NUMERO} />
        % del anticipo
        {porcentaje > 0 ? (
          <label className="ml-1 inline-flex items-center gap-1.5 text-[0.8rem] text-grava">
            <input type="checkbox" className="size-4 accent-botella" {...register(`rangos.${indice}.ofreceCredito`)} />
            También como crédito
          </label>
        ) : (
          <span className="ml-1 text-[0.8rem] font-semibold text-alerta">Se retiene el anticipo</span>
        )}
        {!fijo && (
          <button type="button" onClick={alQuitar} className="ml-1 text-[0.8rem] font-semibold text-grava underline underline-offset-4 hover:text-error">
            Quitar
          </button>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-error">{error}</p>}
    </li>
  );
}
