import type { ReactNode } from "react";

export const CAMBIO_DE_ACCESO = "cambio-de-acceso";

/**
 * Cómo entra cada parte de la pantalla al pasar entre el inicio de sesión y el registro:
 * - `tarjeta`: la tarjeta de acceso sube.
 * - `formulario`: el formulario de registro sube.
 * - `panel`: el «Te fichamos» aparece sobre la cancha.
 * - `ficha`: la ficha se coloca un instante después, con un leve giro.
 */
export type ParteDelAcceso = "tarjeta" | "formulario" | "panel" | "ficha";

/**
 * Hace entrar una parte de la pantalla mientras la cancha frena.
 * Es una animación CSS al montarse: no depende de cuántas veces se actualice la página.
 */
export function TransicionDeAcceso({ parte, children }: { parte: ParteDelAcceso; children: ReactNode }) {
  return <div className={`entrada-de-acceso entrada-de-acceso--${parte}`}>{children}</div>;
}
