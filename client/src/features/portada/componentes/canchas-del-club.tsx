"use client";

import { useState } from "react";
import { TEXTO_DE_CARACTERISTICA } from "@/compartido/canchas/caracteristicas";
import { PlantaDeCancha } from "@/compartido/canchas/planta-de-cancha";
import { NOMBRE_DEL_TIPO, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import type { CanchaDelClub } from "@/compartido/club/servicios/club";

type Filtro = "TODAS" | TipoDeCancha;

function FichaDelClub({ cancha }: { cancha: CanchaDelClub }) {
  return (
    <article aria-labelledby={`cancha-${cancha.id}`} className="ficha-del-club">
      <div className="ficha-del-club__planta">
        <PlantaDeCancha tipo={cancha.tipo} tieneIluminacion={cancha.tieneIluminacion} juntoALaPared={cancha.caracteristicas.includes("JUNTO_A_LA_PARED")} className="ficha-del-club__dibujo" />
        <span className="ficha-del-club__tipo">{NOMBRE_DEL_TIPO[cancha.tipo]}</span>
      </div>
      <div className="flex flex-col gap-2.5 p-5">
        <h3 id={`cancha-${cancha.id}`} className="font-titular text-3xl leading-none font-black text-cancha">{cancha.nombre}</h3>
        <p className="text-sm text-grava">{cancha.tieneIluminacion ? "Con luz para jugar de noche" : "Solo con luz natural: se juega de día"}</p>
        {cancha.caracteristicas.length > 0 && (
          <ul aria-label="Detalles" className="flex flex-wrap gap-1.5">
            {cancha.caracteristicas.map((c) => <li key={c} className="rounded-full bg-tiza px-2.5 py-0.5 text-xs font-bold text-botella">{TEXTO_DE_CARACTERISTICA[c]}</li>)}
          </ul>
        )}
        {cancha.nota && <p className="text-sm text-grava">{cancha.nota}</p>}
        <a href="#turnos" className="mt-1 w-fit font-bold text-botella hover:underline">Ver sus turnos</a>
      </div>
    </article>
  );
}

/** Las canchas operativas del club, con un filtro por tipo si hay de los dos. */
export function CanchasDelClub({ canchas }: { canchas: CanchaDelClub[] }) {
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const tipos = [...new Set(canchas.map((c) => c.tipo))];
  const visibles = canchas.filter((c) => filtro === "TODAS" || c.tipo === filtro);
  if (canchas.length === 0) return <p className="text-grava">Pronto publicaremos nuestras canchas.</p>;

  return (
    <div className="flex flex-col gap-6">
      {tipos.length > 1 && (
        <div role="group" aria-label="Filtrar canchas" className="filtro-del-club">
          {(["TODAS", ...tipos] as Filtro[]).map((valor) => (
            <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
              {valor === "TODAS" ? "Todas" : NOMBRE_DEL_TIPO[valor]}
            </button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-5">
        {visibles.map((cancha) => <li key={cancha.id} className="flex"><FichaDelClub cancha={cancha} /></li>)}
      </ul>
    </div>
  );
}
