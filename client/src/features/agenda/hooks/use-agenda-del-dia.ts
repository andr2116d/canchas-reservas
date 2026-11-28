"use client";

import { useCallback } from "react";
import { useConsultaEnVivo } from "@/compartido/disponibilidad/use-consulta-en-vivo";
import { consultarAgenda } from "../servicios/agenda.api";
import type { FiltrosDeLaAgenda } from "../utilidades/filtros";

/**
 * La agenda del día con los filtros dados. Se actualiza sola cuando cambia una reserva
 * (el server lo avisa al momento) y cuando vence una reserva por pagar.
 */
export function useAgendaDelDia({ fecha, canchaId, estado }: FiltrosDeLaAgenda) {
  const pedir = useCallback((senal: AbortSignal) => consultarAgenda({ fecha, canchaId, estado }, senal), [fecha, canchaId, estado]);
  const { valor: agenda, cargando, error, conexion } = useConsultaEnVivo(pedir);
  return { agenda, cargando, error, conexion };
}
