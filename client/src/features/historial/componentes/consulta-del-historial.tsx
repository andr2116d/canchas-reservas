"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useState, useTransition } from "react";
import { aDireccion, type Filtros } from "../utilidades/filtros";

interface Consulta {
  /** Lo que la pantalla muestra: se actualiza al instante, antes de que llegue la página. */
  filtros: Filtros;
  /** Fecha de hoy en Lima, para los atajos de período. */
  hoy: string;
  /** Cambia filtros y vuelve a la primera página. */
  aplicar: (cambios: Partial<Filtros>) => void;
  /** Consulta exactamente estos filtros. */
  consultar: (filtros: Filtros) => void;
  /** Cambia de página y lleva la vista al inicio de la lista. */
  irAPagina: (cambios: Pick<Filtros, "pagina"> & Partial<Filtros>) => void;
}

const ContextoDeConsulta = createContext<Consulta | undefined>(undefined);

export const rangoInvertido = ({ desde, hasta }: Pick<Filtros, "desde" | "hasta">) => Boolean(desde && hasta && hasta < desde);

/** Si la dirección cambia por otra vía (Atrás, recargar), lo que se muestra se toma de nuevo. */
function useFiltrosEnPantalla(filtros: Filtros) {
  const [enPantalla, setEnPantalla] = useState(filtros);
  const [origen, setOrigen] = useState(aDireccion(filtros));
  if (aDireccion(filtros) !== origen) {
    setOrigen(aDireccion(filtros));
    setEnPantalla(filtros);
  }
  return [enPantalla, setEnPantalla] as const;
}

function llevarALaLista() {
  const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("registros-del-historial")?.scrollIntoView?.({ behavior: quieto ? "auto" : "smooth", block: "start" });
}

/**
 * Comparte los filtros entre el encabezado, la barra y la paginación, y los lleva a la
 * dirección. Dos cambios seguidos se suman aunque la página aún no llegue; un rango de
 * fechas invertido no se consulta. Mientras llega la página nueva, la actual se atenúa.
 */
export function ConsultaDelHistorial({ filtros, hoy, encabezado, children }: { filtros: Filtros; hoy: string; encabezado?: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [enPantalla, setEnPantalla] = useFiltrosEnPantalla(filtros);
  const consultar = (nuevos: Filtros) => {
    setEnPantalla(nuevos);
    if (!rangoInvertido(nuevos)) iniciar(() => router.push(aDireccion(nuevos), { scroll: false }));
  };
  const consulta: Consulta = {
    filtros: enPantalla,
    hoy,
    consultar,
    aplicar: (cambios) => consultar({ ...enPantalla, ...cambios, pagina: 1 }),
    irAPagina: (cambios) => {
      consultar({ ...enPantalla, ...cambios });
      llevarALaLista();
    },
  };
  return (
    <ContextoDeConsulta.Provider value={consulta}>
      {encabezado}
      <div aria-busy={pendiente || undefined} data-pendiente={pendiente || undefined} className="consulta-del-historial flex flex-col gap-4">
        {children}
      </div>
    </ContextoDeConsulta.Provider>
  );
}

export function useConsultaDelHistorial(): Consulta {
  const consulta = useContext(ContextoDeConsulta);
  if (!consulta) throw new Error("El historial necesita una ConsultaDelHistorial.");
  return consulta;
}
