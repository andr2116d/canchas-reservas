"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { DiaDeLaSemana } from "./horario";
import type { HorarioDelDiaEnBorrador, TarifaEnBorrador } from "./turnos";

/** Días abiertos con su horario; un día que falta está cerrado. */
export type SemanaEnBorrador = Partial<Record<DiaDeLaSemana, HorarioDelDiaEnBorrador>>;

interface Borrador {
  semana?: SemanaEnBorrador;
  /** Tarifa de cada tipo de cancha; falta si sus datos todavía no son válidos. */
  tarifas: Partial<Record<string, TarifaEnBorrador>>;
  publicarSemana: (semana: SemanaEnBorrador) => void;
  publicarTarifa: (tipo: string, tarifa: TarifaEnBorrador | undefined) => void;
}

const ContextoDelBorrador = createContext<Borrador | undefined>(undefined);

/**
 * Lo que se está editando del horario y de las tarifas, aunque no se haya guardado,
 * para mostrar en vivo los turnos que saldrían.
 */
export function ProveedorDelBorrador({ children, semanaInicial }: { children: ReactNode; semanaInicial?: SemanaEnBorrador }) {
  const [semana, setSemana] = useState<SemanaEnBorrador | undefined>(semanaInicial);
  const [tarifas, setTarifas] = useState<Borrador["tarifas"]>({});
  const publicarTarifa = useCallback((tipo: string, tarifa: TarifaEnBorrador | undefined) => {
    setTarifas((actuales) => ({ ...actuales, [tipo]: tarifa }));
  }, []);
  const valor = useMemo(() => ({ semana, tarifas, publicarSemana: setSemana, publicarTarifa }), [semana, tarifas, publicarTarifa]);
  return <ContextoDelBorrador.Provider value={valor}>{children}</ContextoDelBorrador.Provider>;
}

export function useBorrador(): Borrador {
  const borrador = useContext(ContextoDelBorrador);
  if (!borrador) throw new Error("useBorrador necesita un ProveedorDelBorrador.");
  return borrador;
}
