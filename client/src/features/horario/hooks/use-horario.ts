"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { HorarioConsultado } from "@/compartido/horario/horario";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { type DatosDelFormularioDeHorario, esquemaDeHorario } from "../esquemas/horario.schema";
import { guardarHorario } from "../servicios/horario.api";
import { valoresDelFormulario } from "../utilidades/datos-del-horario";

export type AvisoDeGuardado = "guardado" | "sin-cambios";

/** Edita el horario de la semana y refresca la pantalla al guardar. */
export function useHorario(consultado: HorarioConsultado) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDeGuardado>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDelFormularioDeHorario>({
    resolver: zodResolver(esquemaDeHorario),
    mode: "onTouched",
    defaultValues: valoresDelFormulario(consultado),
  });

  const enviar = formulario.handleSubmit(async (datos) => {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const resultado = await guardarHorario(datos);
    if (resultado.tipo === "guardado") {
      setAviso(resultado.cambio ? "guardado" : "sin-cambios");
      router.refresh();
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, resultado.errores);
    } else {
      setErrorGeneral(resultado.mensaje);
    }
  });

  return { formulario, enviar, aviso, errorGeneral };
}
