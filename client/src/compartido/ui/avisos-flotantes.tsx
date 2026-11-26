"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { PelotaQueRebota } from "@/compartido/ui/pelota-que-rebota";

const DURACION_DEL_AVISO = 3500;

const ContextoDeAvisos = createContext<((texto: string) => void) | undefined>(undefined);

/** Da a la pantalla un aviso flotante que confirma cada acción y se anuncia al lector de pantalla. */
export function ProveedorDeAvisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ texto: string; vez: number }>();
  const avisar = useCallback((texto: string) => setAviso({ texto, vez: Date.now() }), []);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(undefined), DURACION_DEL_AVISO);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  return (
    <ContextoDeAvisos.Provider value={avisar}>
      {children}
      <div role="status" className="aviso-flotante" data-visible={Boolean(aviso)}>
        {aviso && (
          <>
            <PelotaQueRebota tamano="boton" />
            <span key={aviso.vez}>{aviso.texto}</span>
          </>
        )}
      </div>
    </ContextoDeAvisos.Provider>
  );
}

export function useAvisar(): (texto: string) => void {
  const avisar = useContext(ContextoDeAvisos);
  if (!avisar) throw new Error("Los avisos necesitan un ProveedorDeAvisos.");
  return avisar;
}
