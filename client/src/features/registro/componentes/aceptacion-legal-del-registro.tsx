"use client";

import { useController, useFormContext } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { VERSION_LEGAL_DEL_REGISTRO } from "../servicios/version-legal-del-registro";

/** Registra la versión de los documentos solo cuando el jugador marca la casilla. */
export function AceptacionLegalDelRegistro() {
  const { control } = useFormContext<DatosRegistro>();
  const {
    field: { name, ref, onBlur, onChange, value },
    fieldState: { error },
  } = useController({ control, name: "versionLegalAceptada" });

  return (
    <div className="text-sm">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-linea bg-papel px-3.5 py-2 text-tinta">
        <input
          type="checkbox"
          name={name}
          ref={ref}
          onBlur={onBlur}
          checked={value === VERSION_LEGAL_DEL_REGISTRO}
          onChange={(evento) => onChange(evento.currentTarget.checked ? VERSION_LEGAL_DEL_REGISTRO : "")}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "aceptacion-legal-error" : undefined}
          className="size-5 shrink-0 accent-botella focus-visible:outline-2 focus-visible:outline-botella"
        />
        <span>
          Acepto los términos y condiciones y la política de privacidad.
          <span aria-hidden="true" className="ml-0.5 text-error">*</span>
        </span>
      </label>
      <p id="aceptacion-legal-error" aria-live="polite" className="mt-1.5 font-medium text-error empty:hidden">
        {error?.message}
      </p>
    </div>
  );
}
