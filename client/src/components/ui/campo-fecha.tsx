"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { fecha as fechaEnPantalla } from "@/lib/formato";

type Props = {
  etiqueta: string;
  fecha: string;
  onCambiar: (fecha: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
};

function Calendario() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

/** Muestra la fecha como dd/mm/aaaa sin depender del idioma del navegador; el selector es el nativo. */
export function CampoFecha({ etiqueta, fecha, onCambiar, min, max, disabled, className }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      <div
        className={cn(
          "relative flex h-10 items-center justify-between gap-2 rounded-lg border border-linea bg-superficie px-3 text-texto transition-colors focus-within:border-cesped-600 focus-within:ring-2 focus-within:ring-cesped-600/20",
          disabled && "bg-fondo text-texto-apagado",
          className,
        )}
      >
        <span aria-hidden className="tabular-nums">
          {fecha ? fechaEnPantalla(fecha) : "dd/mm/aaaa"}
        </span>
        <Calendario />
        <input
          id={id}
          type="date"
          required
          value={fecha}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(evento) => {
            if (evento.target.value) onCambiar(evento.target.value);
          }}
          onClick={(evento) => {
            try {
              evento.currentTarget.showPicker?.();
            } catch {}
          }}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
