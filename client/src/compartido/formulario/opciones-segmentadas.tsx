"use client";

import { useFormContext } from "react-hook-form";

export interface OpcionSegmentada {
  valor: string;
  texto: string;
}

interface OpcionesSegmentadasProps {
  nombre: string;
  leyenda: string;
  opciones: OpcionSegmentada[];
}

/** Elección entre pocas opciones a un toque, sin lista desplegable. Su error se anuncia debajo. */
export function OpcionesSegmentadas({ nombre, leyenda, opciones }: OpcionesSegmentadasProps) {
  const { register, formState } = useFormContext();
  const mensaje = formState.errors[nombre]?.message;
  const error = typeof mensaje === "string" ? mensaje : undefined;
  const columnas = opciones.length === 2 ? "grid-cols-2" : "grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]";

  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={error ? `${nombre}-error` : undefined}>
      <legend className="mb-1.5 text-sm font-semibold text-tinta">
        {leyenda}
        <span aria-hidden="true" className="ml-0.5 text-error">
          *
        </span>
      </legend>
      <div className={`grid ${columnas} gap-1 rounded-xl bg-linea/60 p-1`}>
        {opciones.map(({ valor, texto }) => (
          <label
            key={valor}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-grava transition-colors has-checked:bg-papel has-checked:text-botella has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-botella"
          >
            <input type="radio" value={valor} className="sr-only" {...register(nombre)} />
            {texto}
          </label>
        ))}
      </div>
      <p id={`${nombre}-error`} aria-live="polite" className="text-sm font-medium text-error empty:hidden">
        {error}
      </p>
    </fieldset>
  );
}
