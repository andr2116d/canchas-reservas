"use client";

import { useEffect, useState } from "react";
import type { DiaDeLaSemana } from "@/compartido/horario/horario";
import { consultarTurnosDelDia, type ResultadoDeLaConsulta } from "../servicios/tarifas.api";
import type { TipoDeCancha } from "../servicios/tarifas";

/** Tipo y día elegidos y los turnos que devuelve la API; se consulta al cambiar cualquiera. */
export function useTurnosDelDia() {
  const [tipo, setTipo] = useState<TipoDeCancha>("FUTBOL_5");
  const [dia, setDia] = useState<DiaDeLaSemana>("LUNES");
  const [resultado, setResultado] = useState<ResultadoDeLaConsulta>();

  useEffect(() => {
    let vigente = true;
    void consultarTurnosDelDia(tipo, dia).then((respuesta) => {
      if (vigente) setResultado(respuesta);
    });
    return () => {
      vigente = false;
    };
  }, [tipo, dia]);

  return { tipo, setTipo, dia, setDia, resultado };
}
