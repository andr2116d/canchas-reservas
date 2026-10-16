"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  acciones?: React.ReactNode;
  className?: string;
};

export function Modal({ abierto, onCerrar, titulo, children, acciones, className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-linea bg-superficie p-0 text-texto shadow-sm backdrop:bg-noche-900/40",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 className="text-xl font-semibold">{titulo}</h2>
        <div>{children}</div>
        {acciones && <div className="flex justify-end gap-2">{acciones}</div>}
      </div>
    </dialog>
  );
}
