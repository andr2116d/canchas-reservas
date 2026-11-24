"use client";

import { type ReactNode, useState } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";

const PESTANAS = [
  { clave: "datos", texto: "Mis datos" },
  { clave: "seguridad", texto: "Seguridad" },
  { clave: "actividad", texto: "Actividad" },
] as const;

type Pestana = (typeof PESTANAS)[number]["clave"];

/** Mi cuenta en pestañas de vidrio sobre la cancha: datos, seguridad y actividad. */
export function MiCuentaEnPestanas({ paneles }: { paneles: Record<Pestana, ReactNode> }) {
  const [actual, setActual] = useState<Pestana>("datos");
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Mi cuenta"
        descripcion="Tus datos, tu seguridad y tu actividad."
        accion={
          <div role="tablist" aria-label="Secciones de mi cuenta" className="vidrio-verde flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-2xl p-1">
            {PESTANAS.map(({ clave, texto }) => (
              <button
                key={clave}
                type="button"
                role="tab"
                id={`pestana-${clave}`}
                aria-selected={actual === clave}
                aria-controls={`panel-${clave}`}
                onClick={() => setActual(clave)}
                className="rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap text-tiza/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-capitan aria-selected:bg-papel aria-selected:text-tinta"
              >
                {texto}
              </button>
            ))}
          </div>
        }
      />
      {PESTANAS.map(({ clave }) => (
        <div key={clave} role="tabpanel" id={`panel-${clave}`} aria-labelledby={`pestana-${clave}`} hidden={actual !== clave} className="panel-de-mi-cuenta">
          {paneles[clave]}
        </div>
      ))}
    </>
  );
}
