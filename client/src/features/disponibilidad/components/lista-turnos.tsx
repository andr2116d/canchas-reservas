"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { ETIQUETA_TAMANO, type Cancha, type Turno } from "../api";
import { IconoIluminacion } from "./icono-iluminacion";
import { TarjetaTurno } from "./turno-disponibilidad";

type Props = {
  canchas: Cancha[];
  onElegir: (cancha: Cancha, turno: Turno) => void;
};

export function ListaTurnos({ canchas, onElegir }: Props) {
  const [canchaActivaId, setCanchaActivaId] = useState(canchas[0]?.id);
  const canchaActiva = canchas.find((c) => c.id === canchaActivaId) ?? canchas[0];

  if (!canchaActiva) return null;

  return (
    <div className="flex flex-col gap-3 lg:hidden">
      <div role="tablist" aria-label="Canchas" className="flex flex-wrap gap-2">
        {canchas.map((cancha) => {
          const activa = cancha.id === canchaActiva.id;
          return (
            <button
              key={cancha.id}
              type="button"
              role="tab"
              aria-selected={activa}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium",
                activa ? "bg-cesped-600 text-white" : "border border-linea bg-superficie text-texto",
              )}
              onClick={() => setCanchaActivaId(cancha.id)}
            >
              {cancha.nombre}
              <IconoIluminacion encendida={cancha.iluminacion} />
            </button>
          );
        })}
      </div>

      <p className="text-sm text-texto-suave">{ETIQUETA_TAMANO[canchaActiva.tamano]}</p>

      <ul className="flex flex-col gap-2">
        {canchaActiva.turnos.map((turno) => (
          <li key={turno.horaInicio}>
            <TarjetaTurno turno={turno} onElegir={(t) => onElegir(canchaActiva, t)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
