"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type EstadoDeLaConexion, escucharCambios } from "../servicios/avisos-de-cambios";
import type { MapaDelDia } from "../servicios/disponibilidad";
import { consultarMapa } from "../servicios/disponibilidad.api";

/** Entre dos consultas por avisos pasa al menos esto, para no caer en un bucle. */
const ESPERA_MINIMA_MS = 1000;
/** Un poco después del cambio, para que el server ya lo vea. */
const MARGEN_DEL_CAMBIO_MS = 1000;
const ESPERA_MAXIMA_MS = 60 * 60 * 1000;

/** Cuánto falta para `proximoCambio`, medido con la hora del server y no con la del dispositivo. */
function esperaHastaElCambio({ ahora, proximoCambio }: MapaDelDia): number | undefined {
  if (!proximoCambio) return undefined;
  const falta = new Date(proximoCambio).getTime() - new Date(ahora).getTime() + MARGEN_DEL_CAMBIO_MS;
  return Math.min(Math.max(falta, ESPERA_MINIMA_MS), ESPERA_MAXIMA_MS);
}

/** Pide el mapa de la fecha que se mira; la consulta anterior se cancela y el último mapa se conserva. */
function useConsultaDelMapa() {
  const [mapa, setMapa] = useState<MapaDelDia>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string>();
  const fecha = useRef<string | undefined>(undefined);
  const enCurso = useRef<AbortController | undefined>(undefined);
  const ultimaConsulta = useRef(0);

  const consultar = useCallback(async () => {
    enCurso.current?.abort();
    const control = new AbortController();
    enCurso.current = control;
    ultimaConsulta.current = Date.now();
    setCargando(true);
    const resultado = await consultarMapa(fecha.current, control.signal);
    if (control.signal.aborted) return;
    setCargando(false);
    if (resultado.tipo === "error") return setError(resultado.mensaje);
    setError(undefined);
    fecha.current = resultado.mapa.fecha;
    setMapa(resultado.mapa);
  }, []);

  const elegirFecha = useCallback(
    (nueva: string) => {
      fecha.current = nueva;
      void consultar();
    },
    [consultar],
  );

  useEffect(() => () => enCurso.current?.abort(), []);
  return { mapa, cargando, error, consultar, elegirFecha, ultimaConsulta };
}

/**
 * Mapa de turnos de un día que se actualiza solo: cuando el server avisa un cambio
 * y cuando algo cambia por la hora (empieza un turno o termina un mantenimiento).
 */
export function useMapaDelDia() {
  const { mapa, cargando, error, consultar, elegirFecha, ultimaConsulta } = useConsultaDelMapa();
  const [conexion, setConexion] = useState<EstadoDeLaConexion>("conectado");
  const pendiente = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const consultarSinRepetir = useCallback(() => {
    if (pendiente.current) return;
    const falta = ultimaConsulta.current + ESPERA_MINIMA_MS - Date.now();
    pendiente.current = setTimeout(() => {
      pendiente.current = undefined;
      void consultar();
    }, Math.max(falta, 0));
  }, [consultar, ultimaConsulta]);

  useEffect(() => {
    void consultar();
    const dejarDeEscuchar = escucharCambios({ alCambiar: consultarSinRepetir, alCambiarConexion: setConexion });
    return () => {
      dejarDeEscuchar();
      clearTimeout(pendiente.current);
    };
  }, [consultar, consultarSinRepetir]);

  useEffect(() => {
    const espera = mapa && esperaHastaElCambio(mapa);
    if (espera === undefined) return;
    const reloj = setTimeout(() => void consultar(), espera);
    return () => clearTimeout(reloj);
  }, [mapa, consultar]);

  return { mapa, cargando, error, conexion, elegirFecha };
}
