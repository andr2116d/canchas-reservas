"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { filtrarCarneExtranjeria, filtrarDni } from "./filtros-de-entrada";
import { CampoDeTexto } from "./campo-de-texto";
import { SelectorTipoDocumento } from "./selector-tipo-documento";

/**
 * Tipo y número de documento. Con DNI solo entran 8 números (teclado numérico);
 * con carné de extranjería, hasta 12 letras o números.
 */
export function CamposDelDocumento() {
  const { control } = useFormContext();
  const tipoDocumento = useWatch({ control, name: "tipoDocumento" });

  return (
    <div className="flex flex-col gap-4">
      <SelectorTipoDocumento />
      <CampoDeTexto
        nombre="numeroDocumento"
        etiqueta="Número de documento"
        inputMode={tipoDocumento === "DNI" ? "numeric" : "text"}
        filtrarEntrada={tipoDocumento === "DNI" ? filtrarDni : filtrarCarneExtranjeria}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
