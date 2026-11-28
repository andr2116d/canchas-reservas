"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type DefaultValues, type FieldValues, useForm } from "react-hook-form";
import type { z } from "zod";
import type { ResultadoDeVersion } from "@/compartido/api/guardar-version";
import { atenderRechazo } from "./marcar-errores-del-server";

export type AvisoDeGuardado = "guardado" | "sin-cambios";

interface OpcionesDelFormulario<T extends FieldValues> {
  esquema: z.ZodType<T, T>;
  valoresIniciales: DefaultValues<T>;
  guardar: (datos: T) => Promise<ResultadoDeVersion>;
}

/** Edita una regla del local con versiones: guarda, dice si hubo cambio y refresca la pantalla. */
export function useFormularioDeVersion<T extends FieldValues>({ esquema, valoresIniciales, guardar }: OpcionesDelFormulario<T>) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDeGuardado>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<T>({ resolver: zodResolver(esquema), mode: "onTouched", defaultValues: valoresIniciales });

  const enviar = formulario.handleSubmit(async (datos) => {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const resultado = await guardar(datos);
    if (resultado.tipo === "guardado") {
      setAviso(resultado.cambio ? "guardado" : "sin-cambios");
      router.refresh();
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return { formulario, enviar, aviso, errorGeneral };
}
