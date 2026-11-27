"use client";

import { useMemo, useSyncExternalStore } from "react";
import { leerTurnoElegido, type TurnoElegido } from "./turno-elegido";

const sinCambios = () => () => undefined;

/** El turno elegido en la dirección; en el server y antes de hidratar, ninguno. */
export function useTurnoDeLaDireccion(): TurnoElegido | undefined {
  const busqueda = useSyncExternalStore(sinCambios, () => window.location.search, () => "");
  return useMemo(() => leerTurnoElegido(new URLSearchParams(busqueda)), [busqueda]);
}
