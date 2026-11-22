"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { soloDigitos } from "../utilidades/solo-digitos";
import { CampoDeTexto } from "./campo-de-texto";
import { SelectorTipoDocumento } from "./selector-tipo-documento";

/** Tipo y número de documento. Con DNI solo se pueden escribir números y el teclado es numérico. */
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
        filtrarEntrada={tipoDocumento === "DNI" ? soloDigitos : undefined}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
