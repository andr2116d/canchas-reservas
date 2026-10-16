"use client";

import { useEffect, useEffectEvent } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { EVENTO_TURNOS_ACTUALIZADOS } from "./eventos-tiempo-real";
import { obtenerSocket } from "./socket";

/**
 * Escucha `turnos:actualizados` e invalida `claves` cuando el cambio toca `fecha` (o alguna de ellas).
 * Un `null` en `fecha` significa "todas". Un evento con otra forma se ignora.
 * Al reconectar también invalida, porque pudo perderse un evento.
 */
export function useTurnosEnVivo(fecha: string | string[], claves: QueryKey[]) {
  const cliente = useQueryClient();
  const fechas = [...new Set(Array.isArray(fecha) ? fecha : [fecha])].filter(Boolean).sort().join(",");

  const invalidar = useEffectEvent(() => {
    for (const queryKey of claves) cliente.invalidateQueries({ queryKey });
  });

  useEffect(() => {
    if (!fechas) return;
    const lista = fechas.split(",");
    const socket = obtenerSocket();
    const manejar = (payload: unknown) => {
      if (lista.some((dia) => afectaFecha(payload, dia))) invalidar();
    };
    let desconectado = false;
    const alDesconectar = () => {
      desconectado = true;
    };
    const alConectar = () => {
      if (!desconectado) return;
      desconectado = false;
      invalidar();
    };
    socket.on(EVENTO_TURNOS_ACTUALIZADOS, manejar);
    socket.on("disconnect", alDesconectar);
    socket.on("connect", alConectar);
    return () => {
      socket.off(EVENTO_TURNOS_ACTUALIZADOS, manejar);
      socket.off("disconnect", alDesconectar);
      socket.off("connect", alConectar);
    };
  }, [fechas]);
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
