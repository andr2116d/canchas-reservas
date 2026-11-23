"use client";

import type { ChangeEvent, ClipboardEvent, InputHTMLAttributes, ReactNode } from "react";
import { useFormContext, type UseFormRegisterReturn } from "react-hook-form";
import { EtiquetaDeCampo } from "./etiqueta-de-campo";

export interface CampoDeTextoProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id"> {
  /** Nombre del campo en el formulario; también es su id. */
  nombre: string;
  etiqueta: string;
  /** Texto de ayuda permanente, debajo del campo. */
  ayuda?: string;
  /** Contenido al final del campo, por ejemplo un botón para mostrar la contraseña. */
  accesorio?: ReactNode;
  /** Los campos son obligatorios salvo que se indique lo contrario. */
  opcional?: boolean;
  /** Limita lo que se escribe en el campo (por ejemplo, el largo del DNI). */
  filtrarEntrada?: (valor: string) => string;
}

const ESTILO_ENTRADA =
  "w-full rounded-lg border border-linea bg-papel px-3.5 py-2.5 text-base text-tinta " +
  "outline-none transition-colors placeholder:text-grava/60 " +
  "focus-visible:border-botella focus-visible:ring-3 focus-visible:ring-botella/25 " +
  "aria-invalid:border-error aria-invalid:focus-visible:ring-error/20";

/**
 * Aplica el filtro sobre lo escrito o pegado y deja el cursor donde estaba,
 * descontando los caracteres descartados antes de él.
 */
function filtrarConservandoCursor(evento: ChangeEvent<HTMLInputElement>, filtrar: (valor: string) => string) {
  const entrada = evento.target;
  const posicion = entrada.selectionStart ?? entrada.value.length;
  const cursor = filtrar(entrada.value.slice(0, posicion)).length;
  entrada.value = filtrar(entrada.value);
  entrada.setSelectionRange(cursor, cursor);
}

function eventosDeEntradaFiltrada(
  registro: UseFormRegisterReturn,
  filtrar: CampoDeTextoProps["filtrarEntrada"],
  guardarPegado: (valor: string) => void,
) {
  if (!filtrar) return {};
  return {
    onChange(evento: ChangeEvent<HTMLInputElement>) {
      filtrarConservandoCursor(evento, filtrar);
      return registro.onChange(evento);
    },
    onPaste(evento: ClipboardEvent<HTMLInputElement>) {
      evento.preventDefault();
      const entrada = evento.currentTarget;
      const inicio = entrada.selectionStart ?? entrada.value.length;
      const fin = entrada.selectionEnd ?? inicio;
      // Conserva todos los caracteres salvo espacios y guiones entre dígitos.
      const pegado = evento.clipboardData.getData("text").trim().replace(/(?<=\d)[\s-]+(?=\d)/g, "");
      const completo = entrada.value.slice(0, inicio) + pegado + entrada.value.slice(fin);
      const filtrado = filtrar(completo);
      guardarPegado(filtrado === completo.toUpperCase() ? filtrado : completo);
      entrada.setSelectionRange(inicio + pegado.length, inicio + pegado.length);
    },
  };
}

/** Campo de texto con su etiqueta, su ayuda y su error asociados. */
export function CampoDeTexto({
  nombre,
  etiqueta,
  ayuda,
  accesorio,
  opcional = false,
  filtrarEntrada,
  className = "",
  ...entrada
}: CampoDeTextoProps) {
  const { register, setValue, formState } = useFormContext();
  const registro = register(nombre);
  const eventos = eventosDeEntradaFiltrada(registro, filtrarEntrada, (valor) =>
    setValue(nombre, valor, { shouldDirty: true, shouldValidate: true }),
  );
  const mensaje = formState.errors[nombre]?.message;
  const error = typeof mensaje === "string" ? mensaje : undefined;
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
          {...registro}
          {...eventos}
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
