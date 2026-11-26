"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { EtiquetaDeCampo } from "./etiqueta-de-campo";

interface CampoDeAreaDeTextoProps {
  nombre: string;
  etiqueta: string;
  maximo: number;
  ayuda?: string;
  opcional?: boolean;
  filas?: number;
}

/** Texto largo con su etiqueta, su ayuda, un contador de caracteres y su error asociados. */
export function CampoDeAreaDeTexto({ nombre, etiqueta, maximo, ayuda, opcional = false, filas = 4 }: CampoDeAreaDeTextoProps) {
  const { register, control, formState } = useFormContext();
  const valor = (useWatch({ control, name: nombre }) as string | undefined) ?? "";
  const mensaje = formState.errors[nombre]?.message;
  const error = typeof mensaje === "string" ? mensaje : undefined;
  const descripcion = [ayuda && `${nombre}-ayuda`, error && `${nombre}-error`].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <EtiquetaDeCampo htmlFor={nombre} opcional={opcional}>
          {etiqueta}
        </EtiquetaDeCampo>
        <span aria-hidden="true" className="text-xs text-grava tabular-nums">
          {valor.length} de {maximo}
        </span>
      </div>
      <textarea
        id={nombre}
        rows={filas}
        maxLength={maximo}
        required={!opcional}
        aria-invalid={Boolean(error)}
        aria-describedby={descripcion || undefined}
        className="w-full resize-y rounded-lg border border-linea bg-papel px-3.5 py-2.5 text-base text-tinta outline-none transition-colors focus-visible:border-botella focus-visible:ring-3 focus-visible:ring-botella/25 aria-invalid:border-error"
        {...register(nombre)}
      />
      {ayuda && (
        <p id={`${nombre}-ayuda`} className="text-sm text-grava">
          {ayuda}
        </p>
      )}
      <p id={`${nombre}-error`} aria-live="polite" className="text-sm font-medium text-error empty:hidden">
        {error}
      </p>
    </div>
  );
}
