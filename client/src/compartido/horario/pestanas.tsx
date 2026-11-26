"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { ListaDePestanas } from "@/compartido/ui/lista-de-pestanas";

export type Pestana = "horario" | "tarifas" | "cancelacion" | "turnos";

const ContextoDePestana = createContext<{ activa: Pestana; elegir: (pestana: Pestana) => void } | undefined>(undefined);

const PESTANAS: { valor: Pestana; texto: string; className?: string }[] = [
  { valor: "horario", texto: "Horario" },
  { valor: "tarifas", texto: "Tarifas" },
  { valor: "cancelacion", texto: "Cancelación" },
  { valor: "turnos", texto: "Turnos", className: "lg:hidden" },
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

/** Pestañas de vidrio sobre la cancha; «Turnos» solo aparece en pantallas angostas. */
export function PestanasDeHorarioYTarifas() {
  const { activa, elegir } = usePestana();
  return <ListaDePestanas etiqueta="Secciones de las reglas de reserva" pestanas={PESTANAS} activa={activa} alElegir={elegir} />;
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
