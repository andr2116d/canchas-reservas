"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { desactivarRecepcionista } from "../servicios/recepcionistas.api";
import { BOTON_SECUNDARIO } from "./estilos";

const BOTON_DE_PELIGRO =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-error px-4 py-2 text-sm font-bold text-papel " +
  "hover:bg-error/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:opacity-60";

/** Desactiva la cuenta después de confirmar qué significa. */
export function DesactivacionDeCuenta({ id, nombres }: { id: number; nombres: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
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

  if (!confirmando) {
    return <button type="button" onClick={() => setConfirmando(true)} className={`${BOTON_SECUNDARIO} self-start text-error`}>Desactivar cuenta</button>;
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
          {enviando ? "Desactivando…" : "Sí, desactivar"}
        </button>
        <button type="button" onClick={() => setConfirmando(false)} disabled={enviando} className={BOTON_SECUNDARIO}>Cancelar</button>
      </div>
    </div>
  );
}
