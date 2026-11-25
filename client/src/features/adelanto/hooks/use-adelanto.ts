"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { type DatosDelAdelanto, esquemaDelAdelanto } from "../esquemas/adelanto.schema";
import { guardarAdelanto } from "../servicios/adelanto.api";
import type { AdelantoConsultado } from "../servicios/adelanto";

export type AvisoDeGuardado = "guardado" | "sin-cambios";

/** Edita el adelanto mínimo y refresca la pantalla al guardar. */
export function useAdelanto({ vigente, propuesta }: AdelantoConsultado) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDeGuardado>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDelAdelanto>({
    resolver: zodResolver(esquemaDelAdelanto),
    mode: "onTouched",
    defaultValues: { porcentaje: String(vigente?.porcentaje ?? propuesta) },
  });

  const enviar = formulario.handleSubmit(async (datos) => {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const resultado = await guardarAdelanto(datos);
    if (resultado.tipo === "guardado") {
      setAviso(resultado.cambio ? "guardado" : "sin-cambios");
      router.refresh();
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return { formulario, enviar, aviso, errorGeneral };
}
