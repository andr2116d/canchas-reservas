import type { ReactNode } from "react";
import { DibujoDelBalon } from "./dibujo-del-balon";

/** Estilo de la acción principal de un aviso: destaca sobre la cancha. */
export const ACCION_PRINCIPAL_DEL_AVISO =
  "inline-flex min-h-12 items-center rounded-xl bg-capitan px-6 py-3 font-bold text-tinta transition-colors " +
  "hover:bg-papel focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-capitan";

/** Estilo de la acción secundaria de un aviso: un enlace sobre la cancha. */
export const ACCION_SECUNDARIA_DEL_AVISO =
  "font-bold text-tiza underline decoration-capitan decoration-2 underline-offset-6 " +
  "hover:text-capitan focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-capitan";

interface PantallaDeAvisoProps {
  /** Código HTTP del aviso. Sin código, se muestra solo el balón. */
  codigo?: string;
  titulo: string;
  mensaje: string;
  /** Acciones para salir del aviso. */
  children: ReactNode;
}

function BalonDelCodigo() {
  return (
    <svg className="pantalla-de-aviso__balon" viewBox="-13 -13 26 26" focusable="false">
      <DibujoDelBalon claseDeLosGajos="pantalla-de-aviso__gajos" />
    </svg>
  );
}

/**
 * Aviso a pantalla completa sobre la cancha: ruta que no existe, acceso sin
 * permiso o error al cargar. El cero del código se dibuja como un balón que cae.
 */
export function PantallaDeAviso({ codigo, titulo, mensaje, children }: PantallaDeAvisoProps) {
  const cifras = codigo ? [...codigo] : ["0"];

  return (
    <main className="cancha-completa grid min-h-dvh place-items-center px-5 py-12">
      <div className="flex max-w-xl flex-col items-center text-center">
        {codigo && <span className="sr-only">{`Error ${codigo}`}</span>}
        <p aria-hidden="true" className="pantalla-de-aviso__codigo">
          {cifras.map((cifra, posicion) =>
            cifra === "0" ? <BalonDelCodigo key={posicion} /> : <span key={posicion}>{cifra}</span>,
          )}
        </p>
        <h1 className="mt-6 font-titular text-4xl leading-tight font-black text-balance text-tiza sm:text-5xl">{titulo}</h1>
        <p className="mt-3 max-w-md text-lg text-pretty text-tiza/80">{mensaje}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">{children}</div>
      </div>
    </main>
  );
}
