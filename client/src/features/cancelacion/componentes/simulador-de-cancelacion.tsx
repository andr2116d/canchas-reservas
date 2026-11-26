"use client";

import { useState } from "react";
import { filtrarMonto } from "@/compartido/formulario/filtrar-monto";
import { type CasoDeEjemplo, useSimulacionDeCancelacion } from "../hooks/use-simulacion-de-cancelacion";
import { useReglaEnEdicion } from "./proveedor-de-la-regla";
import { duracionEnTexto } from "../utilidades/datos-de-la-regla";
import { ResultadoDeLaSimulacion } from "./resultado-de-la-simulacion";

// El deslizador llega al doble del rango mayor, para que todo su recorrido sirva.
const HORAS_MINIMAS_DEL_DESLIZADOR = 6;

function minutosMaximos(rangos: { desdeHoras: string }[] | undefined): number {
  const mayor = Math.max(0, ...(rangos ?? []).map((rango) => Number(rango.desdeHoras) || 0));
  return Math.max(HORAS_MINIMAS_DEL_DESLIZADOR, mayor * 2) * 60;
}

function CampoEnSoles({ id, etiqueta, valor, alCambiar, error }: { id: string; etiqueta: string; valor: string; alCambiar: (valor: string) => void; error?: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs font-bold text-tinta">
      {etiqueta}
      <span className="flex w-28 items-center rounded-lg border border-linea bg-papel focus-within:border-botella focus-within:ring-3 focus-within:ring-botella/25">
        <span aria-hidden="true" className="pl-2.5 font-semibold text-grava">S/</span>
        <input id={id} inputMode="decimal" value={valor} onChange={(evento) => alCambiar(filtrarMonto(evento.target.value))} aria-invalid={Boolean(error)} className="w-full bg-transparent px-1.5 py-1.5 text-sm font-bold tabular-nums outline-none" />
      </span>
      {error && <span className="max-w-[14ch] font-semibold text-error">{error}</span>}
    </label>
  );
}

/** Prueba la regla en edición con un caso: anticipo, lo pagado y con cuánta anticipación se cancela. */
export function SimuladorDeCancelacion() {
  const [caso, setCaso] = useState<CasoDeEjemplo>({ anticipo: "50.00", pagado: "50.00", minutosDeAnticipacion: 90 });
  const { compensacion, errores, calculando, reglaValida } = useSimulacionDeCancelacion(caso);
  const cambiar = (cambios: Partial<CasoDeEjemplo>) => setCaso((actual) => ({ ...actual, ...cambios }));
  const maximo = minutosMaximos(useReglaEnEdicion().rangos);

  return (
    <section aria-labelledby="simulador-titulo" className="vidrio-claro flex flex-col gap-4 rounded-3xl p-5">
      <header className="flex flex-col gap-1">
        <h2 id="simulador-titulo" className="font-titular text-2xl font-black text-tinta">Si alguien cancela…</h2>
        <p className="text-sm text-grava">Prueba la regla con un caso, antes de guardarla.</p>
      </header>
      <div className="flex flex-wrap gap-3">
        <CampoEnSoles id="simulador-anticipo" etiqueta="Anticipo" valor={caso.anticipo} alCambiar={(anticipo) => cambiar({ anticipo })} error={errores.anticipo} />
        <CampoEnSoles id="simulador-pagado" etiqueta="Pagó" valor={caso.pagado} alCambiar={(pagado) => cambiar({ pagado })} error={errores.pagado} />
      </div>
      <label htmlFor="simulador-minutos" className="flex flex-col gap-1 text-xs font-bold text-tinta">
        Cancela antes del turno
        <output className="font-titular text-2xl font-black text-tinta">{duracionEnTexto(caso.minutosDeAnticipacion)}</output>
        <input id="simulador-minutos" type="range" min={0} max={maximo} step={5} value={caso.minutosDeAnticipacion} aria-valuetext={duracionEnTexto(caso.minutosDeAnticipacion)} onChange={(evento) => cambiar({ minutosDeAnticipacion: Number(evento.target.value) })} className="w-full accent-botella" />
      </label>
      <ResultadoDeLaSimulacion compensacion={reglaValida ? compensacion : undefined} calculando={calculando} error={errores.general} />
    </section>
  );
}
