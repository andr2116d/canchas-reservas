"use client";

import type { NivelDeSeguridad } from "../servicios/seguridad-contrasena";
import { useSeguridadContrasena } from "../hooks/use-seguridad-contrasena";

const PRESENTACION: Record<NivelDeSeguridad, { texto: string; segmentos: number; color: string }> = {
  debil: { texto: "Débil", segmentos: 1, color: "bg-error" },
  aceptable: { texto: "Aceptable", segmentos: 2, color: "bg-alerta" },
  buena: { texto: "Buena", segmentos: 3, color: "bg-botella/70" },
  "muy-buena": { texto: "Muy buena", segmentos: 4, color: "bg-botella" },
};

/** Barra de seguridad de la contraseña: orienta, pero no impide crear la cuenta. */
export function IndicadorDeSeguridad() {
  const seguridad = useSeguridadContrasena();
  if (!seguridad) return null;
  const { texto, segmentos, color } = PRESENTACION[seguridad.nivel];

  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden="true" className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((segmento) => (
          <span
            key={segmento}
            className={`h-1.5 rounded-full transition-colors ${segmento <= segmentos ? color : "bg-linea"}`}
          />
        ))}
      </div>
      <p role="status" className="text-sm text-grava">
        <span className="font-semibold text-tinta">Seguridad de la contraseña: {texto}</span>
        {seguridad.aviso && <span>. {seguridad.aviso}</span>}
      </p>
    </div>
  );
}
