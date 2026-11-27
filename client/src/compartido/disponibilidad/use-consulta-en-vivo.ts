"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type EstadoDeLaConexion, escucharCambios } from "./avisos-de-cambios";

/** Entre dos consultas por avisos pasa al menos esto, para no caer en un bucle. */
const ESPERA_MINIMA_MS = 1000;
/** Un poco después del cambio, para que el server ya lo vea. */
const MARGEN_DEL_CAMBIO_MS = 1000;
const ESPERA_MAXIMA_MS = 60 * 60 * 1000;

/** Lo que responde el server: su hora y cuándo cambia solo lo que se mira. */
export interface ConProximoCambio {
  ahora: string;
  proximoCambio: string | null;
}

export type ResultadoEnVivo<T> = { tipo: "consultado"; valor: T } | { tipo: "error"; mensaje: string };

/** Cuánto falta para `proximoCambio`, medido con la hora del server y no con la del dispositivo. */
function esperaHastaElCambio({ ahora, proximoCambio }: ConProximoCambio): number | undefined {
  if (!proximoCambio) return undefined;
  const falta = new Date(proximoCambio).getTime() - new Date(ahora).getTime() + MARGEN_DEL_CAMBIO_MS;
  return Math.min(Math.max(falta, ESPERA_MINIMA_MS), ESPERA_MAXIMA_MS);
}

/** Pide con `pedir`; la consulta anterior se cancela y el último resultado se conserva mientras llega el nuevo. */
function useConsulta<T>(pedir: (senal: AbortSignal) => Promise<ResultadoEnVivo<T>>) {
  const [valor, setValor] = useState<T>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string>();
  const enCurso = useRef<AbortController | undefined>(undefined);
  const ultimaConsulta = useRef(0);

  const consultar = useCallback(async () => {
    enCurso.current?.abort();
    const control = new AbortController();
    enCurso.current = control;
    ultimaConsulta.current = Date.now();
    setCargando(true);
    const resultado = await pedir(control.signal);
    if (control.signal.aborted) return;
    setCargando(false);
    if (resultado.tipo === "error") return setError(resultado.mensaje);
    setError(undefined);
    setValor(resultado.valor);
  }, [pedir]);

  useEffect(() => () => enCurso.current?.abort(), []);
  return { valor, cargando, error, consultar, ultimaConsulta };
}

/**
 * Una consulta que se actualiza sola: al empezar y cada vez que cambia `pedir`, cuando el
 * server avisa un cambio (una vez por segundo como máximo) y cuando llega `proximoCambio`.
 */
export function useConsultaEnVivo<T extends ConProximoCambio>(pedir: (senal: AbortSignal) => Promise<ResultadoEnVivo<T>>) {
  const { valor, cargando, error, consultar, ultimaConsulta } = useConsulta(pedir);
  const [conexion, setConexion] = useState<EstadoDeLaConexion>("conectado");
  const consultarActual = useRef(consultar);
  const pendiente = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    consultarActual.current = consultar;
    void consultar();
  }, [consultar]);

  useEffect(() => {
    const consultarSinRepetir = () => {
      if (pendiente.current) return;
      const falta = ultimaConsulta.current + ESPERA_MINIMA_MS - Date.now();
      pendiente.current = setTimeout(() => {
        pendiente.current = undefined;
        void consultarActual.current();
      }, Math.max(falta, 0));
    };
    const dejarDeEscuchar = escucharCambios({ alCambiar: consultarSinRepetir, alCambiarConexion: setConexion });
    return () => {
      dejarDeEscuchar();
      clearTimeout(pendiente.current);
    };
  }, [ultimaConsulta]);

  useEffect(() => {
    const espera = valor && esperaHastaElCambio(valor);
    if (espera === undefined) return;
    const reloj = setTimeout(() => void consultarActual.current(), espera);
    return () => clearTimeout(reloj);
  }, [valor]);

  return { valor, cargando, error, conexion, consultar };
}
