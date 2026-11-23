"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

interface TarjetaFlotanteProps {
  titulo: string;
  abierta: boolean;
  alCerrar: () => void;
  children: ReactNode;
}

/**
 * Tarjeta que flota sobre la pantalla para una acción corta. Usa el diálogo
 * del navegador: atrapa el foco, se cierra con Escape y deja el fondo inerte.
 */
export function TarjetaFlotante({ titulo, abierta, alCerrar, children }: TarjetaFlotanteProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idDelTitulo = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (abierta && !elemento.open) elemento.showModal();
    if (!abierta && elemento.open) elemento.close();
  }, [abierta]);

  return (
    <dialog ref={dialogo} aria-labelledby={idDelTitulo} onClose={alCerrar} className="tarjeta-flotante">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id={idDelTitulo} className="font-titular text-3xl leading-none font-black text-tinta">{titulo}</h2>
        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          className="min-h-11 rounded-lg px-3 text-sm font-bold text-botella hover:bg-tiza focus-visible:outline-2 focus-visible:outline-botella"
        >
          Cerrar
        </button>
      </div>
      {abierta && children}
    </dialog>
  );
}
