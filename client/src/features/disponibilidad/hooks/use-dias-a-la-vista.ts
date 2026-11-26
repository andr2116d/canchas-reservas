"use client";

import { useSyncExternalStore } from "react";

const CELULAR = "(max-width: 639px)";

// Sin matchMedia (navegadores muy viejos) se usa la tira ancha.
function suscribir(avisar: () => void) {
  const consulta = window.matchMedia?.(CELULAR);
  consulta?.addEventListener("change", avisar);
  return () => consulta?.removeEventListener("change", avisar);
}

/** Cuántos días entran en la tira: cinco en el celular, siete en pantallas más anchas. */
export function useDiasALaVista(): number {
  return useSyncExternalStore(
    suscribir,
    () => (window.matchMedia?.(CELULAR).matches ? 5 : 7),
    () => 7,
  );
}
