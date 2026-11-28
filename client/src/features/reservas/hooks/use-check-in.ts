"use client";

import { useEffect, useState } from "react";
import type { RespuestaDeLaApi } from "@/compartido/api/enviar-json";
import { consultarCheckIn, type DetalleDelCheckIn } from "../servicios/check-in.api";

export function useCheckIn(codigo: string) {
  const [resultado, setResultado] = useState<RespuestaDeLaApi<DetalleDelCheckIn>>();
  useEffect(() => {
    const control = new AbortController();
    void consultarCheckIn(codigo, control.signal).then((respuesta) => {
      if (!control.signal.aborted) setResultado(respuesta);
    });
    return () => control.abort();
  }, [codigo]);
  return resultado;
}
