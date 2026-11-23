"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useBorrador } from "@/compartido/horario/borrador";
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

/** Comparte con la vista previa la tarifa que se está editando, solo si sus datos son válidos. */
function usePublicarTarifa(tipo: string, valores: DatosDeTarifa) {
  const { publicarTarifa } = useBorrador();
  const clave = JSON.stringify(valores);
  useEffect(() => {
    const leidos = esquemaDeTarifa.safeParse(JSON.parse(clave));
    publicarTarifa(tipo, leidos.success ? { tipo, ...leidos.data } : undefined);
  }, [clave, tipo, publicarTarifa]);
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
  usePublicarTarifa(tarifa.tipo, useWatch({ control: formulario.control }) as DatosDeTarifa);

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
