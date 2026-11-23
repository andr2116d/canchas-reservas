"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { DatosDelRango } from "../esquemas/regla.schema";

interface ReglaEnEdicion {
  /** Rangos con formato válido que se están editando; faltan si alguno tiene un error. */
  rangos?: DatosDelRango[];
  publicarRangos: (rangos: DatosDelRango[] | undefined) => void;
  /** Regla de fondo que el server dice que no se cumple, mientras se edita. */
  aviso?: string;
  avisar: (mensaje: string | undefined) => void;
}

const Contexto = createContext<ReglaEnEdicion | undefined>(undefined);

/** Comparte la regla en edición entre la tarjeta y el simulador, que están en columnas distintas. */
export function ProveedorDeLaRegla({ children }: { children: ReactNode }) {
  const [rangos, publicarRangos] = useState<DatosDelRango[]>();
  const [aviso, avisar] = useState<string>();
  const valor = useMemo(() => ({ rangos, publicarRangos, aviso, avisar }), [rangos, aviso]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useReglaEnEdicion(): ReglaEnEdicion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useReglaEnEdicion necesita un ProveedorDeLaRegla.");
  return contexto;
}
