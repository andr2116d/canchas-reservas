"use client";

import { useId, useState } from "react";
import { NOMBRE_DEL_TIPO } from "@/compartido/canchas/tipo-de-cancha";
import { TEXTO_DE_CARACTERISTICA, type Cancha } from "../servicios/canchas";
import { AccionesDeCancha } from "./acciones-de-cancha";
import { FormularioDeCancha } from "./formulario-de-cancha";
import { PlantaDeCancha } from "./planta-de-cancha";

interface FichaDeCanchaProps {
  cancha: Cancha;
  /** Recién creada: entra con su animación. */
  nueva?: boolean;
  /** Posición entre las recién creadas, para que entren una tras otra. */
  orden?: number;
}

function DatosDeLaCancha({ cancha }: { cancha: Cancha }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="rounded-full bg-tinta px-2.5 py-0.5 text-xs font-bold text-papel">{NOMBRE_DEL_TIPO[cancha.tipo]}</span>
        <span className={`luz-de-cancha ${cancha.tieneIluminacion ? "" : "luz-de-cancha--sin"}`}>
          {cancha.tieneIluminacion ? "Con iluminación" : "Solo con luz natural"}
        </span>
      </div>
      {cancha.caracteristicas.length > 0 && (
        <ul aria-label="Cómo es" className="flex flex-wrap gap-1.5">
          {cancha.caracteristicas.map((valor) => (
            <li key={valor} className="rounded-full bg-tiza px-2.5 py-0.5 text-xs font-semibold text-tinta">{TEXTO_DE_CARACTERISTICA[valor]}</li>
          ))}
        </ul>
      )}
      {cancha.nota && <p className="text-sm text-grava">{cancha.nota}</p>}
    </>
  );
}

/** Una cancha dibujada desde arriba con sus datos, sus acciones y su edición en el mismo lugar. */
export function FichaDeCancha({ cancha, nueva = false, orden = 0 }: FichaDeCanchaProps) {
  const [editando, setEditando] = useState(false);
  const idDelNombre = useId();
  const operativa = cancha.estado === "OPERATIVA";
  return (
    <article
      aria-labelledby={idDelNombre}
      className={`ficha-de-cancha ${operativa ? "" : "ficha-de-cancha--apagada"} ${nueva ? "ficha-de-cancha--nueva" : ""}`}
      style={{ animationDelay: `${orden * 90}ms` }}
    >
      <PlantaDeCancha tipo={cancha.tipo} tieneIluminacion={cancha.tieneIluminacion} juntoALaPared={cancha.caracteristicas.includes("JUNTO_A_LA_PARED")} trazar={nueva} />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 id={idDelNombre} className="font-titular text-2xl leading-none font-black break-words text-tinta">{cancha.nombre}</h3>
          <span className={`estado-de-cancha ${operativa ? "" : "estado-de-cancha--apagada"}`}>{operativa ? "Operativa" : "Desactivada"}</span>
        </div>
        {!editando && <DatosDeLaCancha cancha={cancha} />}
        {!editando && <AccionesDeCancha cancha={cancha} alEditar={() => setEditando(true)} />}
      </div>
      {editando && <FormularioDeCancha cancha={cancha} alTerminar={() => setEditando(false)} />}
    </article>
  );
}
