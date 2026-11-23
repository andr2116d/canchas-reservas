"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { HorarioParaSimular, Simulacion, TarifaParaSimular } from "./simulacion";
import { simularTurnos } from "./simulacion.api";

// Espera a que se termine de escribir antes de pedir la vista previa.
const PAUSA_ANTES_DE_SIMULAR_MS = 350;

interface Borrador {
  /** Tipos con una tarifa válida en edición. */
  tiposConTarifa: string[];
  simulacion?: Simulacion;
  calculando: boolean;
  /** Por qué la vista previa no está al día, si pasa algo. */
  aviso?: string;
  publicarHorario: (horario: HorarioParaSimular | undefined) => void;
  publicarTarifa: (tipo: string, tarifa: TarifaParaSimular | undefined) => void;
}

const ContextoDelBorrador = createContext<Borrador | undefined>(undefined);

/** Pide la simulación cuando cambia lo editado; cancela la anterior si llega otra. */
function useSimulacion(horario: HorarioParaSimular | undefined, tarifas: TarifaParaSimular[]) {
  const [simulacion, setSimulacion] = useState<Simulacion>();
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string>();
  const clave = JSON.stringify({ horario, tarifas });

  useEffect(() => {
    const datos = JSON.parse(clave) as { horario?: HorarioParaSimular; tarifas: TarifaParaSimular[] };
    if (!datos.horario) return;
    const control = new AbortController();
    const espera = setTimeout(() => {
      setCalculando(true);
      void simularTurnos({ horario: datos.horario!, tarifas: datos.tarifas }, control.signal).then((resultado) => {
        if (control.signal.aborted) return;
        setCalculando(false);
        if (resultado.tipo === "simulado") {
          setSimulacion(resultado.simulacion);
          setError(undefined);
        } else setError(resultado.mensaje);
      });
    }, PAUSA_ANTES_DE_SIMULAR_MS);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [clave]);

  return { simulacion, calculando, error };
}

/**
 * Lo que se está editando del horario y de las tarifas, aunque no se haya guardado.
 * La vista previa la calcula el server con ese borrador.
 */
export function ProveedorDelBorrador({ children }: { children: ReactNode }) {
  const [horario, publicarHorario] = useState<HorarioParaSimular>();
  const [porTipo, setPorTipo] = useState<Partial<Record<string, TarifaParaSimular>>>({});
  const publicarTarifa = useCallback((tipo: string, tarifa: TarifaParaSimular | undefined) => {
    setPorTipo((actuales) => ({ ...actuales, [tipo]: tarifa }));
  }, []);
  const tarifas = useMemo(() => Object.values(porTipo).filter((tarifa) => tarifa !== undefined), [porTipo]);
  const { simulacion, calculando, error } = useSimulacion(horario, tarifas);
  const aviso = !horario ? "Corrige el horario marcado para actualizar los turnos." : error;

  const valor = useMemo(
    () => ({ tiposConTarifa: tarifas.map((tarifa) => tarifa.tipo), simulacion, calculando, aviso, publicarHorario, publicarTarifa }),
    [tarifas, simulacion, calculando, aviso, publicarTarifa],
  );
  return <ContextoDelBorrador.Provider value={valor}>{children}</ContextoDelBorrador.Provider>;
}

export function useBorrador(): Borrador {
  const borrador = useContext(ContextoDelBorrador);
  if (!borrador) throw new Error("useBorrador necesita un ProveedorDelBorrador.");
  return borrador;
}
