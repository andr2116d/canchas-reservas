"use client";

import { useCallback, useEffect, useRef } from "react";
import { type ResultadoEnVivo, useConsultaEnVivo } from "@/compartido/disponibilidad/use-consulta-en-vivo";
import type { MapaDelDia } from "../servicios/disponibilidad";
import { consultarMapa } from "../servicios/disponibilidad.api";

/**
 * Mapa de turnos de un día que se actualiza solo: cuando el server avisa un cambio
 * y cuando algo cambia por la hora (empieza un turno o termina un mantenimiento).
 */
export function useMapaDelDia() {
  // Sin fecha elegida, la del primer mapa (hoy, según el server) queda fija para las consultas que siguen.
  const fecha = useRef<string | undefined>(undefined);
  const pedir = useCallback(async (senal: AbortSignal): Promise<ResultadoEnVivo<MapaDelDia>> => {
    const resultado = await consultarMapa(fecha.current, senal);
    return resultado.tipo === "consultado" ? { tipo: "consultado", valor: resultado.mapa } : resultado;
  }, []);
  const { valor: mapa, cargando, error, conexion, consultar } = useConsultaEnVivo(pedir);

  useEffect(() => {
    if (mapa) fecha.current ??= mapa.fecha;
  }, [mapa]);

  const elegirFecha = useCallback(
    (nueva: string) => {
      fecha.current = nueva;
      void consultar();
    },
    [consultar],
  );

  return { mapa, cargando, error, conexion, elegirFecha };
}
