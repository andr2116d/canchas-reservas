"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { CampoDeTexto } from "./campo-de-texto";
import { SelectorTipoDocumento } from "./selector-tipo-documento";

/** Tipo y número de documento. El teclado se adapta: numérico para DNI. */
export function CamposDelDocumento() {
  const { control } = useFormContext<DatosRegistro>();
  const tipoDocumento = useWatch({ control, name: "tipoDocumento" });

  return (
    <div className="flex flex-col gap-4">
      <SelectorTipoDocumento />
      <CampoDeTexto
        nombre="numeroDocumento"
        etiqueta="Número de documento"
        inputMode={tipoDocumento === "DNI" ? "numeric" : "text"}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
