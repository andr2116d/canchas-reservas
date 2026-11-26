import type { ReactNode } from "react";

export const CAMBIO_DE_ACCESO = "cambio-de-acceso";

/** Parte de la pantalla que entra al pasar entre el acceso y el registro; cada una tiene su animación en CSS. */
export type ParteDelAcceso = "tarjeta" | "formulario" | "panel" | "ficha";

/**
 * Hace entrar una parte de la pantalla mientras la cancha frena.
 * Es una animación CSS al montarse: no depende de cuántas veces se actualice la página.
 */
export function TransicionDeAcceso({ parte, children }: { parte: ParteDelAcceso; children: ReactNode }) {
  return <div className={`entrada-de-acceso entrada-de-acceso--${parte}`}>{children}</div>;
}
