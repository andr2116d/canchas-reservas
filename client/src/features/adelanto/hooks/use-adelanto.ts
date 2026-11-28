"use client";

import { useFormularioDeVersion } from "@/compartido/formulario/use-formulario-de-version";
import { esquemaDelAdelanto } from "../esquemas/adelanto.schema";
import { guardarAdelanto } from "../servicios/adelanto.api";
import type { AdelantoConsultado } from "../servicios/adelanto";

/** Edita el adelanto mínimo; sin adelanto guardado, empieza con el porcentaje propuesto. */
export function useAdelanto({ vigente, propuesta }: AdelantoConsultado) {
  return useFormularioDeVersion({
    esquema: esquemaDelAdelanto,
    valoresIniciales: { porcentaje: String(vigente?.porcentaje ?? propuesta) },
    guardar: guardarAdelanto,
  });
}
