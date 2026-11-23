"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

export type Pestana = "horario" | "tarifas" | "cancelacion" | "turnos";

const ContextoDePestana = createContext<{ activa: Pestana; elegir: (pestana: Pestana) => void } | undefined>(undefined);

const PESTANAS: { valor: Pestana; texto: string; soloAngosto?: boolean }[] = [
  { valor: "horario", texto: "Horario" },
  { valor: "tarifas", texto: "Tarifas" },
  { valor: "cancelacion", texto: "Cancelación" },
  { valor: "turnos", texto: "Turnos", soloAngosto: true },
];

// Los turnos del día van fijos al costado en pantallas anchas; en las angostas son una pestaña más.
// La cancelación lleva su simulador al costado, o debajo en pantallas angostas.
const VISIBILIDAD: Record<Pestana | "simulador", (activa: Pestana) => string> = {
  horario: (activa) => (activa === "horario" ? "" : activa === "turnos" ? "hidden lg:block" : "hidden"),
  tarifas: (activa) => (activa === "tarifas" ? "" : "hidden"),
  cancelacion: (activa) => (activa === "cancelacion" ? "" : "hidden"),
  turnos: (activa) => (activa === "turnos" ? "" : activa === "cancelacion" ? "hidden" : "hidden lg:block"),
  simulador: (activa) => (activa === "cancelacion" ? "" : "hidden"),
};

export function ProveedorDePestanas({ children }: { children: ReactNode }) {
  const [activa, elegir] = useState<Pestana>("horario");
  return <ContextoDePestana.Provider value={{ activa, elegir }}>{children}</ContextoDePestana.Provider>;
}

function usePestana() {
  const contexto = useContext(ContextoDePestana);
  if (!contexto) throw new Error("Las pestañas necesitan un ProveedorDePestanas.");
  return contexto;
}

/** Pestañas de vidrio sobre la cancha. */
export function PestanasDeHorarioYTarifas() {
  const { activa, elegir } = usePestana();
  return (
    <div role="tablist" aria-label="Secciones de las reglas de reserva" className="vidrio-verde flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-2xl p-1">
      {PESTANAS.map(({ valor, texto, soloAngosto }) => (
        <button
          key={valor}
          type="button"
          role="tab"
          id={`pestana-${valor}`}
          aria-selected={activa === valor}
          aria-controls={`panel-${valor}`}
          onClick={() => elegir(valor)}
          className={`relative rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap text-tiza/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-capitan aria-selected:bg-papel aria-selected:text-tinta aria-selected:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_4px_14px_-6px_rgb(0_0_0/0.45)] ${soloAngosto ? "lg:hidden" : ""}`}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}

/** Contenido de una pestaña. Queda montado aunque no se vea, para no perder lo que se está editando. */
export function PanelDePestana({ pestana, className = "", children }: { pestana: Pestana | "simulador"; className?: string; children: ReactNode }) {
  const { activa } = usePestana();
  const deLaPestana = pestana === "simulador" ? "cancelacion" : pestana;
  return (
    <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`pestana-${deLaPestana}`} className={`${VISIBILIDAD[pestana](activa)} ${className}`}>
      {children}
    </div>
  );
}
