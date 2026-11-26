"use client";

import { useEffect, useRef } from "react";
import { type FieldValues, type UseFormReturn, useWatch } from "react-hook-form";
import type { TipoDocumento } from "./reglas-de-datos-personales";

interface ConDocumento extends FieldValues {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
}

/**
 * Al cambiar el tipo de documento: si pasa a DNI vacía el número (el DNI no
 * admite letras); si pasa a carné, revalida lo escrito con sus reglas.
 */
export function useAjustarDocumentoAlCambiarTipo<T extends ConDocumento>(formulario: UseFormReturn<T>) {
  const { control, getFieldState, setValue, clearErrors, trigger } =
    formulario as unknown as UseFormReturn<ConDocumento>;
  const tipoDocumento = useWatch({ control, name: "tipoDocumento" });
  const tipoAnterior = useRef(tipoDocumento);
  useEffect(() => {
    if (tipoAnterior.current === tipoDocumento) return;
    tipoAnterior.current = tipoDocumento;
    if (tipoDocumento === "DNI") {
      setValue("numeroDocumento", "");
      clearErrors("numeroDocumento");
    } else if (getFieldState("numeroDocumento").isDirty) {
      void trigger("numeroDocumento");
    }
  }, [tipoDocumento, getFieldState, setValue, clearErrors, trigger]);
}
