import { ViewTransition } from "react";
import { CAMBIO_DE_ACCESO } from "./transicion-de-acceso";

/** Comparte la cancha ilustrada entre el inicio de sesión y el registro. */
export function FondoDeCancha({ encuadre }: { encuadre: "acceso" | "registro" }) {
  return (
    <ViewTransition name="cancha-de-acceso" default="none" share={{ default: "none", [CAMBIO_DE_ACCESO]: "cancha-compartida" }}>
      <div aria-hidden="true" className={"fondo-de-cancha fondo-de-cancha--" + encuadre}>
        <svg viewBox="0 0 400 400" focusable="false">
          <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="3" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="3" />
          <circle cx="200" cy="200" r="5" fill="currentColor" />
        </svg>
      </div>
    </ViewTransition>
  );
}
