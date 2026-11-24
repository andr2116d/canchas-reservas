"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import type { CambioDeCancha, Cancha } from "../servicios/canchas";
import { AltaDeCanchas } from "./alta-de-canchas";
import { ProveedorDeAvisos } from "./avisos-de-canchas";
import { CambiosRecientes } from "./cambios-recientes";
import { FichaDeCancha } from "./ficha-de-cancha";
import { cumpleElFiltro, type Filtro, FiltroDeCanchas } from "./filtro-de-canchas";

interface CanchasDelLocalProps {
  canchas: Cancha[];
  cambios: CambioDeCancha[];
  tiposSinTarifa: TipoDeCancha[];
}

/** Señal que aparece una sola vez, tras crear las primeras canchas, para que se sepa dónde quedaron. */
function GuiaTrasElAlta({ alEntender }: { alEntender: () => void }) {
  return (
    <div className="guia-de-canchas">
      <p><b>Estas son tus canchas.</b> Toca «Editar» en cualquiera para cambiar su nombre, la luz o cómo es.</p>
      <button type="button" onClick={alEntender}>Entendido</button>
    </div>
  );
}

function ListaDeCanchas({ canchas, nuevas }: { canchas: Cancha[]; nuevas: number[] }) {
  if (canchas.length === 0) return <p className="text-sm text-grava">No hay canchas en este grupo.</p>;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] items-start gap-3.5">
      {canchas.map((cancha) => (
        <FichaDeCancha key={cancha.id} cancha={cancha} nueva={nuevas.includes(cancha.id)} orden={nuevas.indexOf(cancha.id)} />
      ))}
    </div>
  );
}

/** Canchas del local y su alta. Sin canchas, el alta ocupa toda la tarjeta; con canchas, va al costado. */
export function CanchasDelLocal({ canchas, cambios, tiposSinTarifa }: CanchasDelLocalProps) {
  const router = useRouter();
  const [nuevas, setNuevas] = useState<number[]>([]);
  const [guia, setGuia] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const alCrear = (ids: number[]) => {
    setNuevas(ids);
    setFiltro("todas");
    if (canchas.length === 0) setGuia(true);
    router.refresh();
  };
  const alta = (
    <AltaDeCanchas
      existentes={canchas.map((c) => c.nombre)}
      tiposSinTarifa={tiposSinTarifa}
      alCrear={alCrear}
      senal={guia && canchas.length > 0 ? <p className="guia-de-canchas guia-de-canchas--lado">¿Faltan canchas? Agrégalas aquí cuando quieras.</p> : undefined}
    />
  );
  return (
    <ProveedorDeAvisos>
      {canchas.length === 0 ? (
        alta
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="flex min-w-0 flex-col gap-4">
            {guia && <GuiaTrasElAlta alEntender={() => setGuia(false)} />}
            <FiltroDeCanchas canchas={canchas} filtro={filtro} alElegir={setFiltro} />
            <ListaDeCanchas canchas={canchas.filter((c) => cumpleElFiltro(c, filtro))} nuevas={nuevas} />
            <CambiosRecientes cambios={cambios} />
          </div>
          <div className={`lg:sticky lg:top-24 ${guia ? "alta-de-canchas--resaltada" : ""}`}>{alta}</div>
        </div>
      )}
    </ProveedorDeAvisos>
  );
}
