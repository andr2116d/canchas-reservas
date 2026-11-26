"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { omitirCambioDeContrasena } from "../servicios/acceso.api";

/** Deja el cambio de la contraseña temporal para después y abre el panel. */
export function useOmitirCambio(panel: string) {
  const router = useRouter();
  const [omitiendo, setOmitiendo] = useState(false);
  const [error, setError] = useState<string>();

  async function omitir() {
    setOmitiendo(true);
    setError(undefined);
    const resultado = await omitirCambioDeContrasena();
    if (resultado.tipo === "omitido") {
      router.replace(panel);
      return;
    }
    if (resultado.sesionVencida) {
      router.replace(RUTA_DE_ACCESO + "?motivo=inactividad");
      return;
    }
    setError(resultado.mensaje);
    setOmitiendo(false);
  }

  return { omitir, omitiendo, error };
}
