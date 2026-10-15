"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/campo";
import { sumarDias } from "../fechas";

type Props = {
  fecha: string;
  min: string;
  max: string;
  onCambiar: (fecha: string) => void;
};

/**
 * Chevron con la dirección explícita: "anterior" mira al pasado y "siguiente" al futuro.
 * `m15 18-6-6 6-6` apunta a la izquierda, así que el derecho es el espejo.
 */
function Flecha({ direccion }: { direccion: "izquierda" | "derecha" }) {
  const trazo = direccion === "izquierda" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={trazo} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SelectorFecha({ fecha, min, max, onCambiar }: Props) {
  const anterior = sumarDias(fecha, -1);
  const siguiente = sumarDias(fecha, 1);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Button
        variante="secundario"
        aria-label="Día anterior"
        disabled={anterior < min}
        onClick={() => onCambiar(anterior)}
      >
        <Flecha direccion="izquierda" />
      </Button>
      <Input
        etiqueta="Fecha"
        type="date"
        className="w-[180px]"
        min={min}
        max={max}
        value={fecha}
        onChange={(e) => onCambiar(e.target.value)}
      />
      <Button
        variante="secundario"
        aria-label="Día siguiente"
        disabled={siguiente > max}
        onClick={() => onCambiar(siguiente)}
      >
        <Flecha direccion="derecha" />
      </Button>
    </div>
  );
}
