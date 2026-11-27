"use client";

import Link from "next/link";
import { useEffect, useId } from "react";
import { useMenuDesplegable } from "../marco/use-menu-desplegable";
import type { Rol } from "../sesion/destino-de-sesion";
import { describirAviso } from "./avisos";
import { useAvisos } from "./use-avisos";

const HACE = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const SEGUNDOS_DEL_AVISO_FLOTANTE = 6;

function IconoDeCampana() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" focusable="false">
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Aviso flotante cuando llega uno nuevo con la pantalla abierta; se va solo. */
function AvisoQueLlega({ titulo, enlace, alCerrar }: { titulo: string; enlace: string; alCerrar: () => void }) {
  useEffect(() => {
    const temporizador = setTimeout(alCerrar, SEGUNDOS_DEL_AVISO_FLOTANTE * 1000);
    return () => clearTimeout(temporizador);
  }, [alCerrar, titulo]);
  return (
    <div role="status" className="fixed right-4 bottom-4 z-60 flex max-w-sm items-start gap-3 rounded-2xl border border-white/20 bg-cancha px-4 py-3 text-tiza shadow-xl">
      <div className="text-sm">
        <strong className="block text-papel">{titulo}</strong>
        <Link href={enlace} onClick={alCerrar} className="font-bold text-capitan underline underline-offset-2">Ver</Link>
      </div>
    </div>
  );
}

/** Campana de la barra: cuántos avisos sin leer, la lista y marcar como leídos. Llegan en tiempo real. */
export function CampanaDeAvisos({ rol }: { rol: Rol }) {
  const { avisos, sinLeer, nuevo, descartarNuevo, marcarLeido, marcarTodos } = useAvisos();
  const { abierto, alternar, cerrarMenu, contenedor, boton } = useMenuDesplegable();
  const id = useId();
  const etiqueta = sinLeer > 0 ? `Avisos, ${sinLeer} sin leer` : "Avisos";

  return (
    <div ref={contenedor} className="menu-de-la-cuenta">
      <button ref={boton} type="button" aria-label={etiqueta} aria-expanded={abierto} aria-controls={id} onClick={alternar} className="barra-de-vidrio__cuenta relative">
        <IconoDeCampana />
        {sinLeer > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 rounded-full bg-error px-1 text-center text-xs leading-5 font-bold text-white tabular-nums">{sinLeer}</span>}
      </button>
      {abierto && (
        <div id={id} className="menu-de-la-cuenta__panel w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex items-baseline justify-between gap-3 px-2.5 pt-1.5 pb-2">
            <strong className="font-titular text-xl font-black text-papel">Avisos</strong>
            {sinLeer > 0 && <button type="button" onClick={marcarTodos} className="text-sm font-bold text-capitan underline underline-offset-2">Marcar todo como leído</button>}
          </div>
          {avisos.length === 0 ? (
            <p className="px-2.5 pb-3 text-sm text-tiza/80">No tienes avisos.</p>
          ) : (
            <ul className="flex max-h-[60vh] flex-col overflow-y-auto">
              {avisos.map((aviso) => {
                const { titulo, enlace } = describirAviso(aviso, rol);
                return (
                  <li key={aviso.id}>
                    <Link href={enlace} onClick={() => { void marcarLeido(aviso.id); cerrarMenu(); }} className="menu-de-la-cuenta__opcion flex-col items-start gap-0.5">
                      <span className="flex items-center gap-2">
                        {!aviso.leido && <span aria-hidden="true" className="size-2 rounded-full bg-capitan" />}
                        <span className={aviso.leido ? "font-normal" : "font-bold"}>{titulo}</span>
                        {!aviso.leido && <span className="sr-only">(sin leer)</span>}
                      </span>
                      <span className="text-xs text-tiza/70 tabular-nums">{HACE.format(new Date(aviso.creadoEn))}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {nuevo && <AvisoQueLlega {...describirAviso(nuevo, rol)} alCerrar={descartarNuevo} />}
    </div>
  );
}
