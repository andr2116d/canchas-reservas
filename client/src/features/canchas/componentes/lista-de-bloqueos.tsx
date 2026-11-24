"use client";

import { useState } from "react";
import { useAccionDeCancha } from "../hooks/use-accion-de-cancha";
import { liberarBloqueo, quitarBloqueo } from "../servicios/bloqueos.api";
import type { Bloqueo, BloqueosConsultados } from "../servicios/bloqueos";
import { describirHasta, describirRango } from "../utilidades/rango-en-lima";

const ENLACE = "min-h-10 w-fit text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-botella";

const ACCIONES = {
  EN_CURSO: {
    boton: "Liberar desde ahora",
    explicacion: "La cancha se podrá reservar desde este momento. Queda registrado que el mantenimiento terminó antes.",
    confirmar: "Sí, liberar",
    ejecutar: liberarBloqueo,
    aviso: (b: Bloqueo) => `${b.cancha} vuelve a estar disponible.`,
    clase: "text-botella",
  },
  PROXIMO: {
    boton: "Quitar bloqueo",
    explicacion: "La cancha volverá a estar disponible en ese rango. El historial conserva el bloqueo quitado.",
    confirmar: "Sí, quitar",
    ejecutar: quitarBloqueo,
    aviso: (b: Bloqueo) => `Se quitó el bloqueo de ${b.cancha}.`,
    clase: "text-error",
  },
} as const;

function AccionDelBloqueo({ bloqueo }: { bloqueo: Bloqueo & { etapa: "EN_CURSO" | "PROXIMO" } }) {
  const [confirmando, setConfirmando] = useState(false);
  const { estado, ejecutar } = useAccionDeCancha();
  const accion = ACCIONES[bloqueo.etapa];
  return (
    <>
      <button type="button" aria-expanded={confirmando} onClick={() => setConfirmando(!confirmando)} className={`${ENLACE} ${accion.clase}`}>{accion.boton}</button>
      {confirmando && (
        <div className="confirmacion-de-cancha flex flex-col gap-2 rounded-xl bg-tiza p-2.5 text-xs">
          <p>{accion.explicacion}</p>
          <button type="button" disabled={estado.tipo === "enviando"} onClick={() => ejecutar(() => accion.ejecutar(bloqueo.id), accion.aviso(bloqueo))} className="w-fit rounded-lg bg-botella px-3 py-1.5 text-xs font-bold text-papel">
            {accion.confirmar}
          </button>
          {estado.tipo === "error" && <p role="alert" className="font-medium text-error">{estado.mensaje}</p>}
        </div>
      )}
    </>
  );
}

function TarjetaDeBloqueo({ bloqueo, hoy }: { bloqueo: Bloqueo; hoy: string }) {
  const etiqueta = bloqueo.etapa === "EN_CURSO"
    ? { texto: `Hasta ${describirHasta(bloqueo.fin, hoy)}`, clase: "bg-tinta text-capitan" }
    : bloqueo.tipo === "EMERGENCIA"
      ? { texto: "Emergencia", clase: "bg-error-fondo text-error" }
      : { texto: "Programado", clase: "bg-[#f6e6c4] text-[#6d4600]" };
  return (
    <li className="tarjeta-de-bloqueo flex flex-col gap-1 rounded-xl border border-linea bg-papel p-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <b className="text-tinta">{bloqueo.cancha}</b>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap ${etiqueta.clase}`}>{etiqueta.texto}</span>
      </div>
      <span className="tabular-nums">{describirRango(bloqueo.inicio, bloqueo.fin)}{bloqueo.liberado && " (liberado antes)"}</span>
      <span className="text-grava">{bloqueo.motivo}</span>
      {bloqueo.etapa !== "TERMINADO" && <AccionDelBloqueo bloqueo={bloqueo as Bloqueo & { etapa: "EN_CURSO" | "PROXIMO" }} />}
    </li>
  );
}

function Grupo({ titulo, bloqueos, hoy, vacio }: { titulo: string; bloqueos: Bloqueo[]; hoy: string; vacio?: string }) {
  if (bloqueos.length === 0 && !vacio) return null;
  const id = `grupo-${titulo.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="text-xs font-bold tracking-wider text-grava uppercase">{titulo}</h3>
      {bloqueos.length === 0 ? <p className="text-sm text-grava">{vacio}</p> : (
        <ul className="flex flex-col gap-2">{bloqueos.map((b) => <TarjetaDeBloqueo key={b.id} bloqueo={b} hoy={hoy} />)}</ul>
      )}
    </section>
  );
}

/** Bloqueos en curso y próximos, con sus acciones; los terminados, plegados y sin acciones. */
export function ListaDeBloqueos({ bloqueos, hoy }: { bloqueos: BloqueosConsultados; hoy: string }) {
  const enCurso = bloqueos.sinTerminar.filter((b) => b.etapa === "EN_CURSO");
  const proximos = bloqueos.sinTerminar.filter((b) => b.etapa === "PROXIMO");
  return (
    <aside aria-labelledby="titulo-de-bloqueos" className="vidrio-claro flex flex-col gap-4 rounded-3xl p-5">
      <h2 id="titulo-de-bloqueos" className="font-titular text-2xl leading-none font-black text-tinta">Bloqueos</h2>
      <Grupo titulo="En curso" bloqueos={enCurso} hoy={hoy} />
      <Grupo titulo="Próximos" bloqueos={proximos} hoy={hoy} vacio="No hay bloqueos programados." />
      {bloqueos.terminados.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-bold text-grava">Terminados ({bloqueos.terminados.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">{bloqueos.terminados.map((b) => <TarjetaDeBloqueo key={b.id} bloqueo={b} hoy={hoy} />)}</ul>
        </details>
      )}
    </aside>
  );
}
