"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { useReglaEnEdicion } from "../componentes/proveedor-de-la-regla";
import { type DatosDeLaRegla, esquemaDeLaRegla } from "../esquemas/regla.schema";
import { guardarRegla } from "../servicios/cancelacion.api";
import type { ReglaConsultada } from "../servicios/cancelacion";
import { posicionDelRango, rangoNuevo, rangosDelFormulario } from "../utilidades/datos-de-la-regla";

export type AvisoDeGuardado = "guardada" | "sin-cambios";

/** Comparte con el simulador los rangos en edición, solo si su formato es válido. */
function usePublicarRangos(valores: DatosDeLaRegla) {
  const { publicarRangos } = useReglaEnEdicion();
  const clave = JSON.stringify(valores);
  useEffect(() => {
    const leido = esquemaDeLaRegla.safeParse(JSON.parse(clave));
    publicarRangos(leido.success ? leido.data.rangos : undefined);
  }, [clave, publicarRangos]);
}

/** Edita la regla de cancelación: agrega, quita y ordena rangos, y la guarda. */
export function useReglaDeCancelacion(consultada: ReglaConsultada) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDeGuardado>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeLaRegla>({
    resolver: zodResolver(esquemaDeLaRegla),
    mode: "onTouched",
    defaultValues: { rangos: rangosDelFormulario(consultada) },
  });
  const { fields, insert, remove } = useFieldArray({ control: formulario.control, name: "rangos" });
  usePublicarRangos(useWatch({ control: formulario.control }) as DatosDeLaRegla);

  const enviar = formulario.handleSubmit(async (datos) => {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const resultado = await guardarRegla(datos);
    if (resultado.tipo === "guardada") {
      setAviso(resultado.cambio ? "guardada" : "sin-cambios");
      router.refresh();
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return {
    formulario,
    rangos: fields,
    agregar: () => {
      const actuales = formulario.getValues("rangos");
      const nuevo = rangoNuevo(actuales);
      insert(posicionDelRango(actuales, nuevo), nuevo);
    },
    quitar: remove,
    enviar,
    aviso,
    errorGeneral,
  };
}
