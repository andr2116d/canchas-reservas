"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useTransition } from "react";
import { aDireccion, type Filtros } from "../utilidades/filtros";

const ContextoDeConsulta = createContext<((filtros: Filtros) => void) | undefined>(undefined);

/** Lleva los filtros a la dirección; mientras llega la página nueva, la actual se atenúa. */
export function ConsultaDelHistorial({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const navegar = useCallback(
    (filtros: Filtros) => iniciar(() => router.push(aDireccion(filtros), { scroll: false })),
    [router],
  );
  return (
    <ContextoDeConsulta.Provider value={navegar}>
      <div aria-busy={pendiente || undefined} data-pendiente={pendiente || undefined} className="consulta-del-historial flex flex-col gap-4">
        {children}
      </div>
    </ContextoDeConsulta.Provider>
  );
}

export function useConsultarHistorial(): (filtros: Filtros) => void {
  const navegar = useContext(ContextoDeConsulta);
  if (!navegar) throw new Error("Los filtros necesitan una ConsultaDelHistorial.");
  return navegar;
}
