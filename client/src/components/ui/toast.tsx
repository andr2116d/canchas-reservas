"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const DURACION_MS = 4000;

const tonos = {
  exito: "border-exito/20 bg-exito-fondo text-exito",
  error: "border-error/20 bg-error-fondo text-error",
};

type Tono = keyof typeof tonos;
type Aviso = { id: number; tono: Tono; mensaje: string };
type ContextoToast = { exito: (mensaje: string) => void; error: (mensaje: string) => void };

const Contexto = createContext<ContextoToast | null>(null);

export function ProveedorToast({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguienteId = useRef(0);
  const temporizadores = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  const mostrar = useCallback((tono: Tono, mensaje: string) => {
    const id = ++siguienteId.current;
    setAvisos((actuales) => [...actuales, { id, tono, mensaje }]);
    const temporizador = setTimeout(() => {
      temporizadores.current.delete(temporizador);
      setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
    }, DURACION_MS);
    temporizadores.current.add(temporizador);
  }, []);

  const valor = useMemo(
    () => ({
      exito: (mensaje: string) => mostrar("exito", mensaje),
      error: (mensaje: string) => mostrar("error", mensaje),
    }),
    [mostrar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      {avisos.length > 0 && (
        <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
          {avisos.map((aviso) => (
            <div
              key={aviso.id}
              role={aviso.tono === "error" ? "alert" : "status"}
              className={cn("pointer-events-auto rounded-lg border px-4 py-3 text-sm font-medium shadow-sm", tonos[aviso.tono])}
            >
              {aviso.mensaje}
            </div>
          ))}
        </div>
      )}
    </Contexto.Provider>
  );
}

export function useToast() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useToast debe usarse dentro de ProveedorToast");
  return contexto;
}
