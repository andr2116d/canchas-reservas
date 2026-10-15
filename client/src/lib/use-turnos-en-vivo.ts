"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { obtenerSocket } from "./socket";

/**
 * Escucha `turnos:actualizados` y vuelve a pedir la disponibilidad de `fecha`.
 * Un `null` en `fecha` o en `canchaId` significa "todas", así que alcanza.
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
    socket.on("turnos:actualizados", manejar);
    return () => {
      socket.off("turnos:actualizados", manejar);
    };
  }, [fecha, cliente]);
}

function afectaFecha(payload: unknown, fecha: string) {
  if (!payload || typeof payload !== "object") return true;
  const valor = (payload as { fecha?: unknown }).fecha;
  return valor === null || valor === undefined || valor === fecha;
}
