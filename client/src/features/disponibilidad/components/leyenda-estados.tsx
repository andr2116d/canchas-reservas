"use client";

import { ETIQUETA_ESTADO, type EstadoTurno } from "../api";
import { RAYAS_MANTENIMIENTO } from "./turno-disponibilidad";

const ESTADOS: EstadoTurno[] = ["DISPONIBLE", "PENDIENTE", "OCUPADO", "EN_MANTENIMIENTO"];

const MUESTRAS: Record<EstadoTurno, string> = {
  DISPONIBLE: "bg-cesped-50 border border-cesped-600",
  PENDIENTE: "bg-alerta-fondo",
  OCUPADO: "bg-linea",
  EN_MANTENIMIENTO: RAYAS_MANTENIMIENTO,
};

export function LeyendaEstados() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {ESTADOS.map((estado) => (
        <li key={estado} className="flex items-center gap-2 text-sm text-texto-suave">
          <span aria-hidden className={`size-4 rounded ${MUESTRAS[estado]}`} />
          {ETIQUETA_ESTADO[estado]}
        </li>
      ))}
    </ul>
  );
}
