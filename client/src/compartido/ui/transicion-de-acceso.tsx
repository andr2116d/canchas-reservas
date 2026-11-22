import { ViewTransition, type ReactNode } from "react";

export const CAMBIO_DE_ACCESO = "cambio-de-acceso";

/** Coordina la entrada y salida de los formularios al cambiar de pantalla. */
export function TransicionDeAcceso({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      default="none"
      enter={{ default: "none", [CAMBIO_DE_ACCESO]: "formulario-entra" }}
      exit={{ default: "none", [CAMBIO_DE_ACCESO]: "formulario-sale" }}
    >
      {children}
    </ViewTransition>
  );
}
