"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { type DatosDeContrasenaTemporal, esquemaDeContrasenaTemporal } from "../esquemas/recepcionista.schema";
import type { ResultadoDeAccion } from "../servicios/recepcionistas.api";

/**
 * Envía una contraseña temporal nueva (al reactivar o restablecer) y la guarda
 * para mostrarla y entregarla. Refresca la ficha para ver el cambio.
 */
export function useContrasenaTemporalEntregada(
  ejecutar: (contrasena: string) => Promise<ResultadoDeAccion>,
  alTerminar?: () => void,
) {
  const router = useRouter();
  const [entregable, setEntregable] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeContrasenaTemporal>({
    resolver: zodResolver(esquemaDeContrasenaTemporal),
    mode: "onChange",
    defaultValues: { contrasena: "" },
  });

  const enviar = formulario.handleSubmit(async ({ contrasena }) => {
    setErrorGeneral(undefined);
    const resultado = await ejecutar(contrasena);
    if (resultado.tipo === "hecho") {
      setEntregable(contrasena);
      formulario.reset({ contrasena: "" });
      (alTerminar ?? router.refresh)();
    } else if (resultado.tipo === "datos-rechazados") {
      marcarErroresDelServer(formulario, resultado.errores);
    } else {
      setErrorGeneral(resultado.mensaje);
    }
  });

  return { formulario, enviar, entregable, errorGeneral };
}
