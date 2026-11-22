"use client";

import { useState } from "react";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import { cerrarSesion } from "./sesion.api";
import { salirDelPanel, useVigenciaDeSesion } from "./use-vigencia-de-sesion";

/** Identifica el panel y permite cerrar la sesión. */
export function BarraDeSesion({ venceEn }: { venceEn: string }) {
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState(false);
  useVigenciaDeSesion(venceEn);

  async function alCerrarSesion() {
    setError(false);
    setCerrando(true);
    try {
      await cerrarSesion();
      salirDelPanel();
    } catch {
      setError(true);
      setCerrando(false);
    }
  }

  return (
    <header className="border-b border-linea bg-papel px-5 py-3 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <MonogramaLaPrevia className="h-10 w-auto" />
        <button type="button" onClick={alCerrarSesion} disabled={cerrando} className="min-h-11 rounded-lg px-3 text-sm font-bold text-botella hover:bg-tiza focus-visible:outline-2 focus-visible:outline-botella disabled:opacity-60">
          {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
      {error && <p role="alert" className="mx-auto mt-2 max-w-5xl text-sm text-error">No pudimos cerrar tu sesión. Inténtalo de nuevo.</p>}
    </header>
  );
}
