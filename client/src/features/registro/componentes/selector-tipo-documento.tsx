"use client";

import { useFormContext } from "react-hook-form";
import type { DatosRegistro, TipoDocumento } from "../esquemas/registro.schema";

const OPCIONES: { valor: TipoDocumento; texto: string }[] = [
  { valor: "DNI", texto: "DNI" },
  { valor: "CARNE_EXTRANJERIA", texto: "Carné de extranjería" },
];

/** Elección entre DNI y carné de extranjería, a un toque y sin lista desplegable. */
export function SelectorTipoDocumento() {
  const { register } = useFormContext<DatosRegistro>();

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-tinta">
        Tipo de documento
        <span aria-hidden="true" className="ml-0.5 text-error">
          *
        </span>
      </legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-linea/60 p-1">
        {OPCIONES.map(({ valor, texto }) => (
          <label
            key={valor}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-grava transition-colors has-checked:bg-papel has-checked:text-botella has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-botella"
          >
            <input type="radio" value={valor} className="sr-only" {...register("tipoDocumento")} />
            {texto}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
