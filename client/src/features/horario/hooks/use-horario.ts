"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useBorrador } from "@/compartido/horario/borrador";
import type { HorarioConsultado } from "@/compartido/horario/horario";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { type DatosDelFormularioDeHorario, esquemaDeHorario } from "../esquemas/horario.schema";
import { guardarHorario } from "../servicios/horario.api";
import { datosParaGuardar, semanaDelFormulario, ubicarErrores, valoresDelFormulario } from "../utilidades/datos-del-horario";

export type AvisoDeGuardado = "guardado" | "sin-cambios";

/** Comparte con la vista previa el horario que se está editando, aunque no se haya guardado. */
function usePublicarSemana(valores: DatosDelFormularioDeHorario) {
  const { publicarSemana } = useBorrador();
  const clave = JSON.stringify(valores);
  useEffect(() => {
    publicarSemana(semanaDelFormulario(JSON.parse(clave) as DatosDelFormularioDeHorario));
  }, [clave, publicarSemana]);
}

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
  usePublicarSemana(useWatch({ control: formulario.control }) as DatosDelFormularioDeHorario);

  const enviar = formulario.handleSubmit(async (valores) => {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const resultado = await guardarHorario(datosParaGuardar(valores));
    if (resultado.tipo === "guardado") {
      setAviso(resultado.cambio ? "guardado" : "sin-cambios");
      router.refresh();
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, ubicarErrores(resultado.errores, valores));
    } else {
      setErrorGeneral(resultado.mensaje);
    }
  });

  return { formulario, enviar, aviso, errorGeneral };
}
