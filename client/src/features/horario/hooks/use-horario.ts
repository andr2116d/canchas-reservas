"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useBorrador } from "@/compartido/horario/borrador";
import type { HorarioConsultado } from "@/compartido/horario/horario";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { type DatosDelFormularioDeHorario, esquemaDeHorario } from "../esquemas/horario.schema";
import { guardarHorario, type ReservaFueraDeHorario } from "../servicios/horario.api";
import { datosParaGuardar, ubicarErrores, valoresDelFormulario } from "../utilidades/datos-del-horario";

export type AvisoDeGuardado = "guardado" | "sin-cambios";

/** Comparte con la vista previa el horario que se está editando, solo si es válido. */
function usePublicarHorario(valores: DatosDelFormularioDeHorario) {
  const { publicarHorario } = useBorrador();
  const clave = JSON.stringify(valores);
  useEffect(() => {
    const leido = esquemaDeHorario.safeParse(JSON.parse(clave));
    publicarHorario(leido.success ? datosParaGuardar(leido.data) : undefined);
  }, [clave, publicarHorario]);
}

/**
 * Edita el horario de la semana y refresca la pantalla al guardar. Si deja reservas fuera,
 * las muestra y espera a que se revise el horario o se confirme guardarlo igual.
 */
export function useHorario(consultado: HorarioConsultado) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDeGuardado>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  // Lo que se quiso guardar y las reservas que deja fuera, mientras se decide.
  const [porConfirmar, setPorConfirmar] = useState<{ valores: DatosDelFormularioDeHorario; reservas: readonly ReservaFueraDeHorario[] }>();
  const [confirmando, setConfirmando] = useState(false);
  const formulario = useForm<DatosDelFormularioDeHorario>({
    resolver: zodResolver(esquemaDeHorario),
    mode: "onTouched",
    defaultValues: valoresDelFormulario(consultado),
  });
  usePublicarHorario(useWatch({ control: formulario.control }) as DatosDelFormularioDeHorario);

  async function guardar(valores: DatosDelFormularioDeHorario, confirmar: boolean) {
    setAviso(undefined);
    setErrorGeneral(undefined);
    const resultado = await guardarHorario(datosParaGuardar(valores), confirmar);
    setPorConfirmar(resultado.tipo === "reservas-fuera" ? { valores, reservas: resultado.reservas } : undefined);
    if (resultado.tipo === "guardado") {
      setAviso(resultado.cambio ? "guardado" : "sin-cambios");
      router.refresh();
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, ubicarErrores(resultado.errores, valores));
    } else if (resultado.tipo === "error") {
      setErrorGeneral(resultado.mensaje);
    }
  }

  const enviar = formulario.handleSubmit((valores) => guardar(valores, false));
  async function guardarIgual() {
    if (!porConfirmar || confirmando) return;
    setConfirmando(true);
    await guardar(porConfirmar.valores, true);
    setConfirmando(false);
  }

  const reservasFuera = porConfirmar?.reservas;
  return { formulario, enviar, aviso, errorGeneral, reservasFuera, confirmando, guardarIgual, revisar: () => setPorConfirmar(undefined) };
}
