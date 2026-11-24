"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { atenderRechazo } from "@/compartido/formulario/marcar-errores-del-server";
import { useAjustarDocumentoAlCambiarTipo } from "@/compartido/formulario/use-ajustar-documento";
import { type DatosDeEdicion, esquemaDeEdicion } from "../esquemas/recepcionista.schema";
import { editarRecepcionista } from "../servicios/recepcionistas.api";

/** Edita los datos de una recepcionista y refresca la ficha para ver la acción en el historial. */
export function useEdicionDeRecepcionista(id: number, datos: DatosDeEdicion) {
  const router = useRouter();
  const [guardado, setGuardado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const formulario = useForm<DatosDeEdicion>({
    resolver: zodResolver(esquemaDeEdicion),
    mode: "onChange",
    defaultValues: datos,
  });
  useAjustarDocumentoAlCambiarTipo(formulario);

  const enviar = formulario.handleSubmit(async (cambios) => {
    setGuardado(false);
    setErrorGeneral(undefined);
    const resultado = await editarRecepcionista(id, cambios);
    if (resultado.tipo === "hecho") {
      setGuardado(true);
      router.refresh();
    } else {
      setErrorGeneral(atenderRechazo(formulario, resultado));
    }
  });

  return { formulario, enviar, guardado, errorGeneral };
}
