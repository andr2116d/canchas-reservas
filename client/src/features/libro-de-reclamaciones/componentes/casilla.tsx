"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";

/** Casilla de sí o no con su error anunciado. */
export function Casilla({ nombre, children, obligatoria = false }: { nombre: string; children: ReactNode; obligatoria?: boolean }) {
  const { register, formState } = useFormContext();
  const mensaje = formState.errors[nombre]?.message;
  const error = typeof mensaje === "string" ? mensaje : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-tinta">
        <input
          type="checkbox"
          required={obligatoria}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${nombre}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-botella focus-visible:outline-2 focus-visible:outline-botella"
          {...register(nombre)}
        />
        <span>{children}</span>
      </label>
      <p id={`${nombre}-error`} aria-live="polite" className="text-sm font-medium text-error empty:hidden">
        {error}
      </p>
    </div>
  );
}
