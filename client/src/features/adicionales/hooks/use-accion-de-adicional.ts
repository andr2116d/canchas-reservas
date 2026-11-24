"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import { useAvisar } from "@/compartido/ui/avisos-flotantes";

export type EstadoDeLaAccion = { tipo: "inactiva" } | { tipo: "enviando" } | { tipo: "error"; mensaje: string };

/** Ejecuta un cambio de estado del adicional; si sale bien, avisa y vuelve a pedir la lista. */
export function useAccionDeAdicional() {
  const router = useRouter();
  const avisar = useAvisar();
  const [estado, setEstado] = useState<EstadoDeLaAccion>({ tipo: "inactiva" });

  async function ejecutar(accion: () => Promise<ResultadoDeAccion>, alTerminar: string): Promise<boolean> {
    setEstado({ tipo: "enviando" });
    const resultado = await accion();
    if (resultado.tipo === "hecho") {
      setEstado({ tipo: "inactiva" });
      avisar(alTerminar);
      router.refresh();
      return true;
    }
    setEstado({ tipo: "error", mensaje: resultado.tipo === "error" ? resultado.mensaje : "No se pudo completar. Inténtalo de nuevo." });
    return false;
  }

  return { estado, ejecutar, reiniciar: () => setEstado({ tipo: "inactiva" }) };
}
