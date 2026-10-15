"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EVENTO_TURNOS_ACTUALIZADOS } from "./eventos-tiempo-real";
import { obtenerSocket } from "./socket";

/**
 * Escucha `turnos:actualizados` y vuelve a pedir la disponibilidad de `fecha`.
 * Un `null` en `fecha` significa "todas". Un evento con otra forma se ignora.
 */
export function useTurnosEnVivo(fecha: string) {
  const cliente = useQueryClient();

  useEffect(() => {
    if (!fecha) return;
    const socket = obtenerSocket();
    const manejar = (payload: unknown) => {
      if (!afectaFecha(payload, fecha)) return;
      cliente.invalidateQueries({ queryKey: ["disponibilidad", fecha] });
    };
    socket.on(EVENTO_TURNOS_ACTUALIZADOS, manejar);
    return () => {
      socket.off(EVENTO_TURNOS_ACTUALIZADOS, manejar);
    };
  }, [fecha, cliente]);
}

type CambioTurnos = { fecha: string | null; canchaId: number | null };

function esCambioTurnos(payload: unknown): payload is CambioTurnos {
  if (!payload || typeof payload !== "object") return false;
  const { fecha, canchaId } = payload as Record<string, unknown>;
  return (
    (fecha === null || typeof fecha === "string") &&
    (canchaId === null || typeof canchaId === "number")
  );
}

function afectaFecha(payload: unknown, fecha: string) {
  return esCambioTurnos(payload) && (payload.fecha === null || payload.fecha === fecha);
}
