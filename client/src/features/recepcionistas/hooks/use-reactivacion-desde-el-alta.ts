"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import type { DatosDeAlta } from "../esquemas/recepcionista.schema";
import { reactivarRecepcionista } from "../servicios/recepcionistas.api";

/**
 * Reactiva la cuenta desactivada que coincide con el alta, con la contraseña
 * temporal escrita, y abre su ficha.
 */
export function useReactivacionDesdeElAlta(
  formulario: UseFormReturn<DatosDeAlta>,
  avisarError: (mensaje: string) => void,
) {
  const router = useRouter();
  const [reactivable, setReactivable] = useState<{ id: number; nombres: string }>();
  const [reactivando, setReactivando] = useState(false);

  async function reactivar() {
    if (!reactivable) return;
    setReactivando(true);
    const resultado = await reactivarRecepcionista(reactivable.id, formulario.getValues("contrasena"));
    if (resultado.tipo === "hecho") {
      router.push(`/administracion/recepcionistas/${reactivable.id}`);
      return;
    }
    setReactivando(false);
    if (resultado.tipo === "datos-rechazados") marcarErroresDelServer(formulario, resultado.errores);
    else avisarError(resultado.mensaje);
  }

  return { reactivable, ofrecer: setReactivable, reactivando, reactivar, cancelar: () => setReactivable(undefined) };
}
