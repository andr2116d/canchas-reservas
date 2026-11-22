"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { EtiquetaDeCampo } from "./etiqueta-de-campo";

export interface CampoDeTextoProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id"> {
  nombre: keyof DatosRegistro;
  etiqueta: string;
  /** Texto de ayuda permanente, debajo del campo. */
  ayuda?: string;
  /** Contenido al final del campo, por ejemplo un botón para mostrar la contraseña. */
  accesorio?: ReactNode;
  /** Los campos son obligatorios salvo que se indique lo contrario. */
  opcional?: boolean;
}

const ESTILO_ENTRADA =
  "w-full rounded-lg border border-linea bg-papel px-3.5 py-2.5 text-base text-tinta " +
  "outline-none transition-colors placeholder:text-grava/60 " +
  "focus-visible:border-botella focus-visible:ring-3 focus-visible:ring-botella/25 " +
  "aria-invalid:border-error aria-invalid:focus-visible:ring-error/20";

/** Campo de texto con su etiqueta, su ayuda y su error asociados. */
export function CampoDeTexto({
  nombre,
  etiqueta,
  ayuda,
  accesorio,
  opcional = false,
  className = "",
  ...entrada
}: CampoDeTextoProps) {
  const { register, formState } = useFormContext<DatosRegistro>();
  const error = formState.errors[nombre]?.message;
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;
  const descripcion = [ayuda && idAyuda, error && idError].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <EtiquetaDeCampo htmlFor={nombre} opcional={opcional}>
        {etiqueta}
      </EtiquetaDeCampo>
      <div className="relative">
        <input
          id={nombre}
          required={!opcional}
          aria-invalid={Boolean(error)}
          aria-describedby={descripcion || undefined}
          className={`${ESTILO_ENTRADA} ${className}`}
          {...entrada}
          {...register(nombre)}
        />
        {accesorio}
      </div>
      {ayuda && (
        <p id={idAyuda} className="text-sm text-grava">
          {ayuda}
        </p>
      )}
      <p id={idError} aria-live="polite" className="text-sm font-medium text-error empty:hidden">
        {error}
      </p>
    </div>
  );
}
