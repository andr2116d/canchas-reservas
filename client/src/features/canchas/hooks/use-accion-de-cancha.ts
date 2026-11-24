"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResultadoDelEstado } from "../servicios/canchas.api";
import type { ReservaAfectada } from "../servicios/canchas";
import { useAvisar } from "../componentes/avisos-de-canchas";

export type EstadoDeLaAccion =
  | { tipo: "inactiva" }
  | { tipo: "enviando" }
  | { tipo: "bloqueada"; mensaje: string; reservas: ReservaAfectada[] }
  | { tipo: "error"; mensaje: string };

/** Ejecuta un cambio de estado de la cancha; si sale bien, avisa y vuelve a pedir la lista. */
export function useAccionDeCancha() {
  const router = useRouter();
  const avisar = useAvisar();
  const [estado, setEstado] = useState<EstadoDeLaAccion>({ tipo: "inactiva" });

  async function ejecutar(accion: () => Promise<ResultadoDelEstado>, alTerminar: string): Promise<boolean> {
    setEstado({ tipo: "enviando" });
    const resultado = await accion();
    if (resultado.tipo === "hecho") {
      setEstado({ tipo: "inactiva" });
      avisar(alTerminar);
      router.refresh();
      return true;
    }
    if (resultado.tipo === "bloqueada") setEstado(resultado);
    else setEstado({ tipo: "error", mensaje: resultado.tipo === "error" ? resultado.mensaje : "Revisa los datos e inténtalo de nuevo." });
    return false;
  }

  return { estado, ejecutar, reiniciar: () => setEstado({ tipo: "inactiva" }) };
}
