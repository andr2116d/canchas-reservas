"use client";

import { useState } from "react";
import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import type { CanchaDelMapa, MapaDelDia, TurnoDelMapa, TurnoElegido } from "../servicios/disponibilidad";
import type { TurnoParaMostrar } from "../componentes/tu-turno";

const YA_NO_ESTA_LIBRE = "El turno que elegiste ya no está libre. Elige otro.";

/** Busca en el mapa el turno elegido; si ya no está libre, no lo devuelve. */
function buscar(mapa: MapaDelDia | undefined, elegido: TurnoElegido | undefined): TurnoParaMostrar | undefined {
  if (!mapa || !elegido) return undefined;
  const tipo = mapa.tipos.find((t) => t.tipo === elegido.tipo);
  if (tipo?.estado !== "CON_TURNOS") return undefined;
  const turno = tipo.turnos.find((t) => t.desde === elegido.desde);
  const cancha = tipo.canchas.find((c) => c.id === elegido.canchaId);
  const libre = turno?.canchas.find((c) => c.canchaId === elegido.canchaId)?.estado === "DISPONIBLE";
  return turno && cancha && libre ? { tipo: elegido.tipo, turno, cancha } : undefined;
}

/**
 * El turno elegido en el mapa. Si una actualización lo ocupa, lo quita y avisa por
 * qué; cerrarlo o elegir otro día lo quita sin aviso.
 */
export function useTurnoElegido(mapa: MapaDelDia | undefined) {
  const [elegido, setElegido] = useState<TurnoElegido>();
  const [aviso, setAviso] = useState<string>();
  const actual = buscar(mapa, elegido);
  // Ajuste durante el render (patrón de React para derivar estado): la condición deja de cumplirse.
  if (elegido && !actual) {
    setElegido(undefined);
    setAviso(YA_NO_ESTA_LIBRE);
  }

  return {
    elegido: actual,
    aviso,
    elegir(tipo: TipoDeCancha, turno: TurnoDelMapa, cancha: CanchaDelMapa) {
      setAviso(undefined);
      setElegido({ tipo, desde: turno.desde, canchaId: cancha.id });
    },
    quitar() {
      setAviso(undefined);
      setElegido(undefined);
    },
  };
}
