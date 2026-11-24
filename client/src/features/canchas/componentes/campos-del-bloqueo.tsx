"use client";

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
}

function MomentoDelRango({ id, etiqueta, valor, alCambiar, error, hastaMedianoche }: MomentoDelRangoProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-fecha`} className="text-xs font-bold text-grava">{`Fecha de ${etiqueta.toLowerCase()}`}</label>
        <input id={`${id}-fecha`} type="date" value={valor.fecha} aria-invalid={Boolean(error)} onChange={(e) => alCambiar({ ...valor, fecha: e.target.value })} className={FECHA} />
      </div>
      <MarcadorDeHora id={`${id}-hora`} etiqueta={etiqueta} valor={valor.hora} alCambiar={(hora) => alCambiar({ ...valor, hora })} hastaMedianoche={hastaMedianoche} chico error={error} />
    </div>
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
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      {emergencia ? (
        <p className="flex h-10 items-center gap-2 self-center rounded-full bg-error/10 px-3 text-sm font-bold text-error">
          <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-error" />
          Inicio: ahora, {horaActual}
        </p>
      ) : (
        <MomentoDelRango id="inicio-del-bloqueo" etiqueta="Inicio" valor={borrador.desde} alCambiar={(desde) => cambiar({ desde })} error={errores.desde} />
      )}
      <MomentoDelRango id="fin-del-bloqueo" etiqueta="Fin" valor={borrador.hasta} alCambiar={(hasta) => cambiar({ hasta })} error={errores.hasta} hastaMedianoche />
      <button type="button" onClick={() => cambiar({ hasta: { fecha: borrador.hasta.fecha, hora: "24:00" } })} className="mb-1 w-fit rounded-full border border-dashed border-botella px-3 py-1 text-xs font-bold text-botella">
        Hasta el fin de ese día
      </button>
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
