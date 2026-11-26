"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ErroresPorCampo } from "@/compartido/api/resultado-de-accion";
import { useAvisar } from "./avisos-flotantes";

type Fallo = { tipo: "error"; mensaje: string };

/** Lo que puede responder una acción: hecho, datos rechazados, un fallo u otro estado propio de la pantalla. */
type Resultado<Otro> = { tipo: "hecho" } | { tipo: "datos-rechazados"; errores: ErroresPorCampo } | Fallo | Otro;

export type EstadoDeLaAccion<Otro = never> = { tipo: "inactiva" } | { tipo: "enviando" } | Fallo | Otro;

/**
 * Ejecuta una acción de un toque (desactivar, eliminar, liberar…). Si sale bien,
 * avisa y vuelve a pedir la página; si no, deja el fallo o el estado propio para mostrarlo.
 */
export function useAccionConAviso<Otro extends { tipo: string } = never>() {
  const router = useRouter();
  const avisar = useAvisar();
  const [estado, setEstado] = useState<EstadoDeLaAccion<Otro>>({ tipo: "inactiva" });

  async function ejecutar(accion: () => Promise<Resultado<Otro>>, alTerminar: string): Promise<boolean> {
    setEstado({ tipo: "enviando" });
    const resultado = await accion();
    if (resultado.tipo === "hecho") {
      setEstado({ tipo: "inactiva" });
      avisar(alTerminar);
      router.refresh();
      return true;
    }
    setEstado(resultado.tipo === "datos-rechazados" ? { tipo: "error", mensaje: "Revisa los datos e inténtalo de nuevo." } : (resultado as Fallo | Otro));
    return false;
  }

  return { estado, ejecutar, reiniciar: () => setEstado({ tipo: "inactiva" }) };
}
