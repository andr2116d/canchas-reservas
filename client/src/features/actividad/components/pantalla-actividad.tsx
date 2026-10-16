"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PestanaCambios } from "./pestana-cambios";

const PESTANAS = [{ id: "cambios", etiqueta: "Cambios" }] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

export function PantallaActividad() {
  const [pestana, setPestana] = useState<Pestana>("cambios");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Actividad</h1>
      </header>

      <div role="tablist" aria-label="Actividad" className="flex gap-1 border-b border-linea">
        {PESTANAS.map(({ id, etiqueta }) => (
          <button
            key={id}
            id={`pestana-${id}`}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            aria-controls={`panel-${id}`}
            onClick={() => setPestana(id)}
            className={cn(
              "-mb-px min-h-11 border-b-2 px-4 text-sm font-medium transition-colors",
              pestana === id
                ? "border-cesped-600 text-cesped-700"
                : "border-transparent text-texto-suave hover:text-texto",
            )}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`pestana-${pestana}`}>
        {pestana === "cambios" && <PestanaCambios />}
      </div>
    </div>
  );
}
