"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export type Franja = "DIA" | "NOCHE";

export interface TarifaVigente {
  valor: number;
  desde: string;
}

interface TarjetaFranjaProps {
  franja: Franja;
  vigente: TarifaVigente | null;
  error?: string;
  onGuardar: (valor: string) => void;
}

const TITULOS: Record<Franja, string> = { DIA: "Día", NOCHE: "Noche" };

// Provisional: reemplazar por el formateo de "@/lib/formato" al implementar la pantalla.
export const moneda = (valor: number) => `S/ ${valor.toFixed(2)}`;

export function TarjetaFranja({ franja, vigente, error, onGuardar }: TarjetaFranjaProps) {
  const [texto, setTexto] = useState(vigente ? vigente.valor.toFixed(2) : "");
  const idCampo = `valor-${franja.toLowerCase()}`;
  const idError = `${idCampo}-error`;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-noche-900/15 p-6">
      <header className="flex items-center gap-3">
        <h2 className="font-display text-xl font-bold text-noche-900">{TITULOS[franja]}</h2>
        {franja === "NOCHE" && (
          <span className="rounded-full bg-noche-900/10 px-2.5 py-0.5 text-xs font-medium text-noche-900">
            Franja noche
          </span>
        )}
      </header>

      <div className="flex flex-col gap-1">
        {vigente ? (
          <>
            <p className="font-display text-[32px] font-bold leading-9 text-noche-900">{moneda(vigente.valor)}</p>
            <p className="text-sm text-texto-suave">Rige desde el {vigente.desde}</p>
          </>
        ) : (
          <p className="font-display text-[32px] font-bold leading-9 text-texto-suave">Sin tarifa</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={idCampo} className="text-sm font-medium text-noche-900">
          Nuevo valor por hora
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={idCampo}
            type="text"
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? idError : undefined}
            placeholder="0.00"
            className="w-full rounded-lg border border-noche-900/15 bg-transparent px-3 py-2 text-noche-900 placeholder:text-texto-suave focus:outline-none focus:ring-2 focus:ring-noche-900/30 aria-invalid:border-noche-900"
          />
          <Button onClick={() => onGuardar(texto)}>Guardar</Button>
        </div>
        {error && (
          <p id={idError} role="alert" className="text-sm font-medium text-noche-900">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}