"use client";

import { useEffect, useState } from "react";
import type { RespuestaDeLaApi } from "@/compartido/api/enviar-json";
import type { TurnoElegido } from "@/compartido/sesion/turno-elegido";
import { consultarResumenDeRecepcion, type ResumenDeRecepcion } from "../servicios/recepcion.api";

export function useResumenDeRecepcion({ canchaId, fecha, desde }: TurnoElegido, clienteId: number) {
  const [resultado, setResultado] = useState<RespuestaDeLaApi<ResumenDeRecepcion>>();
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const control = new AbortController();
    void consultarResumenDeRecepcion({ canchaId, fecha, desde }, clienteId, control.signal).then((respuesta) => {
      if (!control.signal.aborted) setResultado(respuesta);
    });
    return () => control.abort();
  }, [canchaId, fecha, desde, clienteId, intento]);
  return { resultado, volverAConsultar: () => setIntento((anterior) => anterior + 1) };
}
