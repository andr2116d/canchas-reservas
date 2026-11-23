"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { type DatosDeTarifa, esquemaDeTarifa } from "../esquemas/tarifa.schema";
import { guardarTarifa } from "../servicios/tarifas.api";
import type { TarifaDelTipo } from "../servicios/tarifas";

export type AvisoDeGuardado = "guardada" | "sin-cambios";

function valoresIniciales({ vigente }: TarifaDelTipo): DatosDeTarifa {
  return {
    precioDia: vigente?.precioDia ?? "",
    precioNoche: vigente?.precioNoche ?? "",
    duracionDelTurno: vigente?.duracionDelTurnoHoras.toString() ?? "",
    ofreceTurnoCorto: vigente?.ofreceTurnoCorto ?? false,
  };
}

/** Edita la tarifa de un tipo de cancha y refresca la pantalla al guardar. */
export function useTarifa(tarifa: TarifaDelTipo) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDeGuardado>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeTarifa>({
    resolver: zodResolver(esquemaDeTarifa),
    mode: "onTouched",
    defaultValues: valoresIniciales(tarifa),
  });

  const enviar = formulario.handleSubmit(async (datos) => {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const resultado = await guardarTarifa(tarifa.tipo, datos);
    if (resultado.tipo === "guardada") {
      setAviso(resultado.cambio ? "guardada" : "sin-cambios");
      router.refresh();
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, resultado.errores);
    } else {
      setErrorGeneral(resultado.mensaje);
    }
  });

  return { formulario, enviar, aviso, errorGeneral };
}
