"use client";

import { type FormEvent, useState } from "react";
import { calcularValorDelTurno, type ResultadoDelCalculo } from "../servicios/tarifas.api";
import type { TipoDeCancha } from "../servicios/tarifas";

/** Tipo y hora elegidos en el simulador y el valor que calculó la API. */
export function useSimulador() {
  const [tipo, setTipo] = useState<TipoDeCancha>("FUTBOL_5");
  const [inicio, setInicio] = useState("17:00");
  const [resultado, setResultado] = useState<ResultadoDelCalculo>();
  const [calculando, setCalculando] = useState(false);

  async function calcular(evento: FormEvent) {
    evento.preventDefault();
    setCalculando(true);
    setResultado(await calcularValorDelTurno(tipo, inicio));
    setCalculando(false);
  }

  return { tipo, setTipo, inicio, setInicio, resultado, calculando, calcular };
}
