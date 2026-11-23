"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { desactivarRecepcionista } from "../servicios/recepcionistas.api";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";

const BOTON_DE_PELIGRO =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-error px-4 py-2 text-sm font-bold text-papel " +
  "hover:bg-error/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:opacity-60";

interface ConfirmacionDeDesactivacionProps {
  id: number;
  nombres: string;
  alCancelar: () => void;
}

/** Explica qué pasa al desactivar la cuenta y la desactiva al confirmar. */
export function ConfirmacionDeDesactivacion({ id, nombres, alCancelar }: ConfirmacionDeDesactivacionProps) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  async function desactivar() {
    setEnviando(true);
    setError(undefined);
    const resultado = await desactivarRecepcionista(id);
    setEnviando(false);
    if (resultado.tipo === "hecho") router.refresh();
    else setError(resultado.tipo === "error" ? resultado.mensaje : "Revisa los datos e inténtalo de nuevo.");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-error/30 bg-error-fondo p-4">
      <p className="text-sm text-tinta">
        {nombres} no podrá iniciar sesión y se cerrarán sus sesiones abiertas. Sus datos y su historial se conservan
        por si vuelve.
      </p>
      {error && <p role="alert" className="text-sm font-semibold text-error">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={desactivar} disabled={enviando} className={BOTON_DE_PELIGRO}>
          <TextoDeEnvio enviando={enviando} texto="Sí, desactivar" textoAlEnviar="Desactivando…" />
        </button>
        <button type="button" onClick={alCancelar} disabled={enviando} className={BOTON_SECUNDARIO}>Cancelar</button>
      </div>
    </div>
  );
}
