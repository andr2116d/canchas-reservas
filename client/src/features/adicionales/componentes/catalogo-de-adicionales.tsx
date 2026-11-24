"use client";

import { useState } from "react";
import { ProveedorDeAvisos } from "@/compartido/ui/avisos-flotantes";
import { TARJETA } from "@/compartido/ui/estilos";
import type { Adicional, CambioDeAdicional } from "../servicios/adicionales";
import { AltaDeAdicional } from "./alta-de-adicional";
import { CambiosDeAdicionales } from "./cambios-de-adicionales";
import { FilaDeAdicional } from "./fila-de-adicional";

const IDEAS = ["Balón", "Chalecos"];

interface CatalogoDeAdicionalesProps {
  adicionales: Adicional[];
  cambios: CambioDeAdicional[];
}

/** Sin adicionales: qué son y dos ideas que llenan el nombre del alta. */
function CatalogoVacio({ alElegir }: { alElegir: (nombre: string) => void }) {
  return (
    <section aria-labelledby="titulo-del-catalogo" className={`${TARJETA} catalogo-vacio flex flex-col items-start gap-3`}>
      <h2 id="titulo-del-catalogo" className="font-titular text-2xl leading-none font-black text-tinta">Aún no hay adicionales</h2>
      <p className="max-w-prose text-sm text-grava">
        Agrega lo que el local presta en la cancha. Recepción lo entrega y, si algo se pierde o se rompe, cobra su precio por unidad.
      </p>
      <div role="group" aria-label="Ideas para empezar" className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold tracking-wide text-grava uppercase">Por ejemplo</span>
        {IDEAS.map((idea) => (
          <button key={idea} type="button" onClick={() => alElegir(idea)} className="rounded-full border border-dashed border-botella px-3 py-1 text-sm font-bold text-botella hover:bg-botella/10">
            {idea}
          </button>
        ))}
      </div>
    </section>
  );
}

function resumenDelCatalogo(adicionales: Adicional[]): string {
  const desactivados = adicionales.filter((a) => a.estado === "DESACTIVADO").length;
  const total = `${adicionales.length} ${adicionales.length === 1 ? "adicional" : "adicionales"}`;
  return desactivados > 0 ? `${total} · ${desactivados} desactivado${desactivados > 1 ? "s" : ""}` : total;
}

/** Catálogo de adicionales con su alta al costado y el historial de cambios debajo. */
export function CatalogoDeAdicionales({ adicionales, cambios }: CatalogoDeAdicionalesProps) {
  const [nuevo, setNuevo] = useState<number>();
  const [sugerencia, setSugerencia] = useState({ nombre: "", vez: 0 });
  return (
    <ProveedorDeAvisos>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {adicionales.length === 0 ? (
            <CatalogoVacio alElegir={(nombre) => setSugerencia(({ vez }) => ({ nombre, vez: vez + 1 }))} />
          ) : (
            <section aria-labelledby="titulo-del-catalogo" className={`${TARJETA} flex flex-col gap-2`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 id="titulo-del-catalogo" className="font-titular text-2xl leading-none font-black text-tinta">Catálogo</h2>
                <p className="text-sm text-grava">{resumenDelCatalogo(adicionales)}</p>
              </div>
              <ul aria-label="Catálogo" className="flex flex-col">
                {adicionales.map((adicional) => (
                  <FilaDeAdicional key={adicional.id} adicional={adicional} nuevo={adicional.id === nuevo} />
                ))}
              </ul>
            </section>
          )}
          <CambiosDeAdicionales cambios={cambios} />
        </div>
        <div className="lg:sticky lg:top-24">
          <AltaDeAdicional key={sugerencia.vez} nombreSugerido={sugerencia.nombre || undefined} alCrear={setNuevo} />
        </div>
      </div>
    </ProveedorDeAvisos>
  );
}
