"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";

const NOMBRE_DEL_DOCUMENTO = { DNI: "DNI", CARNE_EXTRANJERIA: "Carné" } as const;

/** Muestra solo los últimos tres caracteres del documento, por si alguien mira la pantalla. */
function ocultarDocumento(numero: string): string {
  const limpio = numero.trim();
  if (limpio.length <= 3) return limpio;
  return "•".repeat(limpio.length - 3) + limpio.slice(-3);
}

/**
 * Ficha de jugador que se llena mientras la persona escribe. Es una vista previa
 * decorativa: los datos reales están en el formulario, por eso se oculta a lectores de pantalla.
 */
export function FichaJugador() {
  const { control, formState } = useFormContext<DatosRegistro>();
  const [nombres, apellidos, tipo, numero] = useWatch({
    control,
    name: ["nombres", "apellidos", "tipoDocumento", "numeroDocumento"],
  });

  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-sm -rotate-2 rounded-2xl bg-papel p-4 text-tinta sm:p-5 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.55)]"
    >
      <div className="flex items-center justify-between border-b border-dashed border-linea pb-3">
        <div className="flex items-center gap-2">
          <MonogramaLaPrevia className="h-7 w-auto" />
          <span className="font-titular text-lg font-extrabold">La Previa</span>
        </div>
        <span className="text-xs font-semibold text-grava">Ficha de jugador</span>
      </div>
      <p data-testid="ficha-nombres" className="mt-3 truncate font-titular text-4xl leading-none font-black uppercase sm:mt-4 sm:text-5xl">
        {nombres.trim() || "Tu nombre"}
      </p>
      <p className="mt-1 truncate text-lg font-semibold text-grava">{apellidos.trim() || "Tus apellidos"}</p>
      <div className="mt-5 flex items-end justify-between text-sm">
        <span className="tabular-nums">
          {NOMBRE_DEL_DOCUMENTO[tipo]} {ocultarDocumento(numero) || "—"}
        </span>
        <span className="text-grava">Trujillo</span>
      </div>
      {formState.isValid && (
        <span className="absolute -top-3 -right-3 rotate-6 rounded-full bg-capitan px-3 py-1.5 text-sm font-bold text-cancha shadow-md motion-safe:animate-[sello_240ms_ease-out]">
          Lista para jugar
        </span>
      )}
    </div>
  );
}
