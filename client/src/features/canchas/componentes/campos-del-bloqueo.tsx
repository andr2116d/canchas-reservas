"use client";

import type { ReactNode } from "react";
import { MarcadorDeHora } from "@/compartido/marcador/marcador-de-hora";
import type { BorradorDeBloqueo, Momento } from "../esquemas/bloqueo.schema";
import type { Frecuencia } from "../servicios/bloqueos";
import { Segmento } from "./controles-de-cancha";

const ERROR = "text-sm font-medium text-error empty:hidden";
const FECHA = "campo-de-cancha w-fit";

interface SelectorDeCanchasProps {
  canchas: { id: number; nombre: string }[];
  elegidas: number[];
  alCambiar: (elegidas: number[]) => void;
  error?: string;
}

/** Una, varias o todas las canchas operativas. */
export function SelectorDeCanchas({ canchas, elegidas, alCambiar, error }: SelectorDeCanchasProps) {
  const todas = elegidas.length === canchas.length;
  const alternar = (id: number) => alCambiar(elegidas.includes(id) ? elegidas.filter((e) => e !== id) : [...elegidas, id]);
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-tinta">Canchas<span aria-hidden="true" className="ml-0.5 text-error">*</span></legend>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={todas} onClick={() => alCambiar(todas ? [] : canchas.map((c) => c.id))} className="detalle-de-cancha border-dashed">Todas</button>
        {canchas.map((cancha) => (
          <button key={cancha.id} type="button" aria-pressed={elegidas.includes(cancha.id)} onClick={() => alternar(cancha.id)} className="detalle-de-cancha">{cancha.nombre}</button>
        ))}
      </div>
      <p aria-live="polite" className={ERROR}>{error}</p>
    </fieldset>
  );
}

interface MomentoDelRangoProps {
  id: string;
  etiqueta: string;
  valor: Momento;
  alCambiar: (valor: Momento) => void;
  error?: string;
  hastaMedianoche?: boolean;
  /** Un atajo junto al título, como «Hasta el fin de ese día». */
  atajo?: ReactNode;
}

function MomentoDelRango({ id, etiqueta, valor, alCambiar, error, hastaMedianoche, atajo }: MomentoDelRangoProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="sr-only">{etiqueta}</legend>
      <div className="flex min-h-6 items-center justify-between gap-3">
        <span aria-hidden="true" className="text-xs font-bold tracking-wide text-grava uppercase">{etiqueta}</span>
        {atajo}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-fecha`} className="sr-only">{`Fecha de ${etiqueta.toLowerCase()}`}</label>
        <input id={`${id}-fecha`} type="date" value={valor.fecha} aria-invalid={Boolean(error)} onChange={(e) => alCambiar({ ...valor, fecha: e.target.value })} className={FECHA} />
        <MarcadorDeHora id={`${id}-hora`} etiqueta={etiqueta} valor={valor.hora} alCambiar={(hora) => alCambiar({ ...valor, hora })} hastaMedianoche={hastaMedianoche} chico etiquetaOculta error={error} />
      </div>
    </fieldset>
  );
}

interface CamposDelRangoProps {
  borrador: BorradorDeBloqueo;
  cambiar: (cambios: Partial<BorradorDeBloqueo>) => void;
  errores: Record<string, string>;
  horaActual: string;
}

/** Desde y hasta en hora de Lima. Una emergencia empieza ahora y solo pide hasta cuándo. */
export function CamposDelRango({ borrador, cambiar, errores, horaActual }: CamposDelRangoProps) {
  const emergencia = borrador.tipo === "EMERGENCIA";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 justify-center rounded-2xl border border-linea bg-tiza px-4 py-3">
      {emergencia ? (
        <p className="flex h-10 items-center gap-2 rounded-full sm:mt-7.5 bg-error/10 px-3 text-sm font-bold text-error">
          <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-error" />
          Inicio: ahora, {horaActual}
        </p>
      ) : (
        <MomentoDelRango id="inicio-del-bloqueo" etiqueta="Inicio" valor={borrador.desde} alCambiar={(desde) => cambiar({ desde })} error={errores.desde} />
      )}
      <span aria-hidden="true" className="mt-7.5 hidden text-xl font-black text-grava/60 sm:block">→</span>
      <MomentoDelRango
        id="fin-del-bloqueo"
        etiqueta="Fin"
        valor={borrador.hasta}
        alCambiar={(hasta) => cambiar({ hasta })}
        error={errores.hasta}
        hastaMedianoche
        atajo={
          <button type="button" onClick={() => cambiar({ hasta: { fecha: borrador.hasta.fecha, hora: "24:00" } })} className="rounded-full border border-dashed border-botella px-2.5 py-0.5 text-xs font-bold text-botella hover:bg-botella/10">
            Hasta el fin de ese día
          </button>
        }
      />
    </div>
  );
}

const FRECUENCIAS: { valor: Frecuencia; texto: string }[] = [
  { valor: "DIARIA", texto: "Cada día" },
  { valor: "SEMANAL", texto: "Cada semana" },
  { valor: "MENSUAL", texto: "Cada mes" },
];

/** Opcional y plegado: cada cuánto se repite y hasta qué fecha. Cada repetición es un bloqueo propio. */
export function RepeticionDelBloqueo({ borrador, cambiar, error }: { borrador: BorradorDeBloqueo; cambiar: (cambios: Partial<BorradorDeBloqueo>) => void; error?: string }) {
  return (
    <details open={borrador.repite} onToggle={(e) => cambiar({ repite: e.currentTarget.open })} className="rounded-2xl border border-linea bg-tiza px-4 py-1">
      <summary className="cursor-pointer py-2 text-sm font-bold text-tinta">
        ¿Se repite? <span className="font-normal text-grava">opcional</span>
      </summary>
      <div className="flex flex-col gap-2 pb-3">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <Segmento etiqueta="Cada cuánto" opciones={FRECUENCIAS} valor={borrador.frecuencia} alElegir={(frecuencia) => cambiar({ frecuencia })} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="repetir-hasta" className="text-sm font-semibold text-tinta">Hasta el</label>
            <input id="repetir-hasta" type="date" value={borrador.repiteHasta} aria-invalid={Boolean(error)} onChange={(e) => cambiar({ repiteHasta: e.target.value })} className={FECHA} />
          </div>
        </div>
        <p className="text-xs text-grava">Cada repetición es un bloqueo propio que se quita por separado.</p>
        <p aria-live="polite" className={ERROR}>{error}</p>
      </div>
    </details>
  );
}
