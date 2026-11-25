"use client";

import { abrirPreferencias } from "./preferencia-de-cookies";

/** Vuelve a abrir el aviso de cookies para cambiar la elección. */
export function BotonDePreferencias({ className }: { className?: string }) {
  return (
    <button type="button" onClick={abrirPreferencias} className={className}>
      Preferencias de cookies
    </button>
  );
}
