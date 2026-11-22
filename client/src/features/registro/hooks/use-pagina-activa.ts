"use client";

import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => undefined;

/**
 * Indica si React ya activó la página en el navegador. En el HTML que llega del
 * servidor es `false`; sirve para no aceptar texto que se perdería al activarse.
 */
export function usePaginaActiva(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}
