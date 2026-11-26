"use client";

import { useState } from "react";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { ConfirmacionDeDesactivacion } from "./confirmacion-de-desactivacion";

/** Desactiva la cuenta después de confirmar qué significa. */
export function DesactivacionDeCuenta({ id, nombres }: { id: number; nombres: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className={`${BOTON_SECUNDARIO} self-start text-error`}>
        Desactivar cuenta
      </button>
    );
  }
  return <ConfirmacionDeDesactivacion id={id} nombres={nombres} alCancelar={() => setConfirmando(false)} />;
}
