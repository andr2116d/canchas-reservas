"use client";

import { type ReactNode, useState } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { ListaDePestanas } from "@/compartido/ui/lista-de-pestanas";

const PESTANAS = [
  { valor: "datos", texto: "Mis datos" },
  { valor: "seguridad", texto: "Seguridad" },
  { valor: "actividad", texto: "Actividad" },
] as const;

type Pestana = (typeof PESTANAS)[number]["valor"];

/** Mi cuenta en pestañas de vidrio sobre la cancha: datos, seguridad y actividad. */
export function MiCuentaEnPestanas({ paneles }: { paneles: Record<Pestana, ReactNode> }) {
  const [actual, setActual] = useState<Pestana>("datos");
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Mi cuenta"
        descripcion="Tus datos, tu seguridad y tu actividad."
        accion={<ListaDePestanas etiqueta="Secciones de mi cuenta" pestanas={PESTANAS} activa={actual} alElegir={setActual} />}
      />
      {PESTANAS.map(({ valor }) => (
        <div key={valor} role="tabpanel" id={`panel-${valor}`} aria-labelledby={`pestana-${valor}`} hidden={actual !== valor}>
          {paneles[valor]}
        </div>
      ))}
    </>
  );
}
