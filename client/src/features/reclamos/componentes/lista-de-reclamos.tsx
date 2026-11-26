import Link from "next/link";
import type { FilaDeHoja } from "../servicios/reclamos";
import { EtiquetaDeEstado, TipoYMotivo } from "./etiquetas-de-la-hoja";
import { PlazoDeLaHoja } from "./plazo-de-la-hoja";

const FECHA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Cada hoja en una fila: número, quién reclamó y qué, estado y plazo. Lleva a atenderla. */
export function ListaDeReclamos({ hojas }: { hojas: FilaDeHoja[] }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Hojas">
      {hojas.map((hoja) => (
        <li key={hoja.numero}>
          <Link
            href={`/administracion/reclamos/${hoja.numero}`}
            className="grid gap-x-5 gap-y-2 rounded-2xl border border-white/80 bg-papel px-4 py-3.5 shadow-sm transition-colors hover:border-botella/40 focus-visible:outline-2 focus-visible:outline-botella sm:grid-cols-[8rem_minmax(0,1fr)_auto] lg:grid-cols-[8rem_minmax(0,1fr)_7rem_11rem] lg:items-center"
          >
            <span>
              <span className="block font-titular text-xl leading-none font-black text-cancha tabular-nums">{hoja.numero}</span>
              <span className="text-xs text-grava tabular-nums">{FECHA.format(new Date(hoja.registradaEn))}</span>
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <TipoYMotivo tipo={hoja.tipo} motivo={hoja.motivo} />
              <span className="truncate font-semibold text-tinta">{hoja.nombre}</span>
              <span className="truncate text-sm text-grava">{hoja.resumen}</span>
            </span>
            <span className="sm:justify-self-end lg:justify-self-start">
              <EtiquetaDeEstado estado={hoja.estado} vencida={hoja.vencida} />
            </span>
            <span className="sm:col-span-3 lg:col-span-1">
              <PlazoDeLaHoja plazo={hoja} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
